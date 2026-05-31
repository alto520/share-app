import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

interface Photo {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  width?: number;
  height?: number;
}

interface Album {
  id: string;
  title: string;
  clientName: string;
  description: string;
  password?: string;
  isActive: boolean;
  createdDate: string;
  photos: Photo[];
  visitCount: number;
}

const PORT = 3000;
const DATA_DIR = path.resolve();
const ALBUMS_FILE = path.join(DATA_DIR, "albums.json");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

// Ensure dynamic paths exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initial storage boot
let albums: Album[] = [];
if (fs.existsSync(ALBUMS_FILE)) {
  try {
    albums = JSON.parse(fs.readFileSync(ALBUMS_FILE, "utf-8"));
  } catch (e) {
    console.error("Error reading albums.json:", e);
    albums = [];
  }
} else {
  fs.writeFileSync(ALBUMS_FILE, JSON.stringify([], null, 2));
}

// Save database utility
const saveAlbums = () => {
  fs.writeFileSync(ALBUMS_FILE, JSON.stringify(albums, null, 2));
};

// Multer Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 150 * 1024 * 1024, // High limit (150MB) for raw, high-resolution photographs
  },
});

async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json({ limit: "10mb" }));

  // API: Generate AI Artistry album cinematic descriptions
  app.post("/api/system/generate-description", async (req, res) => {
    const { title, clientName } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      res.status(500).json({ error: "Gemini API key is not configured in local environment variables. Please set it in AI Studio secrets." });
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `你是一个顶级奢侈人像与艺术空间婚礼摄影公司的文案总监。现有一个摄影作品集，作品标题是《${title}》，交付客户名字是「${clientName || "客户"}」。请写一段充满电影艺术感、温润留白、优雅内敛的高级中文作品介绍（大概 80 到 150 字），用于此线上无损相册交付系统的卷首栏目。要求：语言精致极简、贴合摄影的光影情绪，直接给出结果，禁止包含格式修辞、括号、说明、多余标注。`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      res.json({ text: text.trim() });
    } catch (err: any) {
      console.error("Gemini AI generation failed:", err);
      res.status(500).json({ error: err.message || "Failed to trigger AI" });
    }
  });

  // API: Get App Status and statistics
  app.get("/api/system/status", (req, res) => {
    let totalPhotos = 0;
    let totalDiskBytes = 0;
    albums.forEach((album) => {
      totalPhotos += album.photos.length;
      album.photos.forEach((p) => {
        totalDiskBytes += p.size;
      });
    });

    res.json({
      activeAlbumsCount: albums.filter((a) => a.isActive).length,
      totalAlbumsCount: albums.length,
      totalPhotosCount: totalPhotos,
      diskUsageMB: Number((totalDiskBytes / (1024 * 1024)).toFixed(1)),
      port: PORT,
    });
  });

  // Admin APIs (No auth for local setup, or simplified management)
  app.get("/api/albums", (req, res) => {
    res.json(albums);
  });

  app.post("/api/albums", (req, res) => {
    const { title, clientName, description, password } = req.body;
    const newAlbum: Album = {
      id: "album_" + Math.random().toString(36).substring(2, 11),
      title: title || "未命名相册",
      clientName: clientName || "客户",
      description: description || "",
      password: password || undefined,
      isActive: true,
      createdDate: new Date().toISOString(),
      photos: [],
      visitCount: 0,
    };
    albums.push(newAlbum);
    saveAlbums();
    res.status(201).json(newAlbum);
  });

  app.put("/api/albums/:id", (req, res) => {
    const { id } = req.params;
    const { title, clientName, description, password, isActive } = req.body;
    const albumIndex = albums.findIndex((a) => a.id === id);

    if (albumIndex === -1) {
      res.status(404).json({ error: "Album not found" });
      return;
    }

    albums[albumIndex] = {
      ...albums[albumIndex],
      title: title !== undefined ? title : albums[albumIndex].title,
      clientName: clientName !== undefined ? clientName : albums[albumIndex].clientName,
      description: description !== undefined ? description : albums[albumIndex].description,
      password: password !== undefined ? (password === "" ? undefined : password) : albums[albumIndex].password,
      isActive: isActive !== undefined ? isActive : albums[albumIndex].isActive,
    };

    saveAlbums();
    res.json(albums[albumIndex]);
  });

  app.delete("/api/albums/:id", (req, res) => {
    const { id } = req.params;
    const albumIndex = albums.findIndex((a) => a.id === id);

    if (albumIndex === -1) {
      res.status(404).json({ error: "Album not found" });
      return;
    }

    // Physically delete photos on disk
    const targetAlbum = albums[albumIndex];
    targetAlbum.photos.forEach((photo) => {
      const filePath = path.join(UPLOADS_DIR, photo.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error("Failed to delete file:", filePath, e);
        }
      }
    });

    albums.splice(albumIndex, 1);
    saveAlbums();
    res.json({ message: "Album deleted successfully" });
  });

  // Photo Upload endpoint
  app.post("/api/albums/:id/upload", upload.array("photos"), (req, res) => {
    const { id } = req.params;
    const album = albums.find((a) => a.id === id);

    if (!album) {
      res.status(404).json({ error: "Album not found" });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const uploadedPhotos: Photo[] = files.map((file) => {
      return {
        id: "photo_" + Math.random().toString(36).substring(2, 11),
        filename: file.filename,
        originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'), // Prevent Chinese characters garbling
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };
    });

    album.photos = [...album.photos, ...uploadedPhotos];
    saveAlbums();

    res.status(201).json(album);
  });

  // Toggle active/inactive for link
  app.post("/api/albums/:id/toggle", (req, res) => {
    const { id } = req.params;
    const album = albums.find((a) => a.id === id);

    if (!album) {
      res.status(404).json({ error: "Album not found" });
      return;
    }

    album.isActive = !album.isActive;
    saveAlbums();
    res.json({ id: album.id, isActive: album.isActive });
  });

  // Client Public view (fetches metadata & photo list)
  app.get("/api/client/albums/:id", (req, res) => {
    const { id } = req.params;
    const album = albums.find((a) => a.id === id);

    if (!album) {
      res.status(404).json({ error: "相册不存在" });
      return;
    }

    if (!album.isActive) {
      res.status(403).json({ error: "该相册分享链接已被关闭" });
      return;
    }

    // Password validation check
    const clientPwd = req.query.password || req.headers["x-album-password"];
    const isPasswordProtected = !!album.password;

    if (isPasswordProtected && album.password !== clientPwd) {
      res.status(401).json({
        isPasswordProtected: true,
        error: "password_required",
        message: "访问受限：请输入查看密码",
      });
      return;
    }

    // Increment visit counts asynchronously
    album.visitCount = (album.visitCount || 0) + 1;
    saveAlbums();

    // Do NOT return the raw password to the client!
    const clientAlbumView = {
      id: album.id,
      title: album.title,
      clientName: album.clientName,
      description: album.description,
      isPasswordProtected,
      createdDate: album.createdDate,
      photos: album.photos.map((photo) => ({
        id: photo.id,
        originalName: photo.originalName,
        size: photo.size,
        uploadedAt: photo.uploadedAt,
      })),
    };

    res.json(clientAlbumView);
  });

  // Secure Photo Fetch/Render Link (prevents scanning, respects password authorization)
  app.get("/api/client/albums/:id/photos/:photoId", (req, res) => {
    const { id, photoId } = req.params;
    const album = albums.find((a) => a.id === id);

    if (!album) {
      res.status(404).send("Album not found");
      return;
    }

    if (!album.isActive) {
      res.status(403).send("Sharing link has been disabled");
      return;
    }

    // Check security access
    const clientPwd = req.query.password || req.query.pwd || req.headers["x-album-password"];
    if (album.password && album.password !== clientPwd) {
      res.status(401).send("Unauthorized photo request");
      return;
    }

    const photo = album.photos.find((p) => p.id === photoId);
    if (!photo) {
      res.status(404).send("Photo references not found");
      return;
    }

    const photoPath = path.join(UPLOADS_DIR, photo.filename);
    if (!fs.existsSync(photoPath)) {
      res.status(404).send("Physical target file not found");
      return;
    }

    // Serve fine-grained raw stream to client
    const isDownload = req.query.download === "true";
    const headerSafeName = encodeURIComponent(photo.originalName);

    if (isDownload) {
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${headerSafeName}`);
    } else {
      res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${headerSafeName}`);
    }

    // Let browser decide content-type by extension in UPLOADS_DIR or dynamic check
    const ext = path.extname(photo.filename).toLowerCase();
    let contentType = "image/jpeg";
    if (ext === ".png") contentType = "image/png";
    if (ext === ".webp") contentType = "image/webp";
    if (ext === ".tiff") contentType = "image/tiff";
    if (ext === ".raw") contentType = "image/x-raw-image";

    res.setHeader("Content-Type", contentType);
    res.sendFile(photoPath);
  });

  // Vite middleware pipeline configuration for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Aperture Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
