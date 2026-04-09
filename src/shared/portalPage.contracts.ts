export interface PortalPage {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePortalPageInput {
  name: string;
  url: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePortalPageInput {
  name?: string;
  url?: string;
  isActive?: boolean;
  sortOrder?: number;
}
