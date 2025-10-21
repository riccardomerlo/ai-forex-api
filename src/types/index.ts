export interface ApiResponse<T = any> {
    status: string;
    message?: string;
    data?: T;
    error?: string;
}

export interface HealthResponse {
    status: string;
    timestamp: string;
    uptime: number;
}