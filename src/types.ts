export interface Photo {
  id: string;
  filename?: string;
  originalName: string;
  size: number;
  uploadedAt: string;
}

export interface Album {
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

export interface SystemStatus {
  activeAlbumsCount: number;
  totalAlbumsCount: number;
  totalPhotosCount: number;
  diskUsageMB: number;
  port: number;
}
