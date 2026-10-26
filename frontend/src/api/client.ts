const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
    throw new Error(
        "VITE_API_BASE_URL is not configured. Check frontend/.env.local.",
    );
}

export class ApiError extends Error {
    public readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
    token?: string;
    body?: unknown;
}

export async function apiRequest<T>(
    path: string,
    options: ApiRequestOptions = {},
): Promise<T> {
    const { token, body, headers, ...requestOptions } = options;

    const requestHeaders = new Headers(headers);

    requestHeaders.set("Accept", "application/json");

    if (body !== undefined) {
        requestHeaders.set("Content-Type", "application/json");
    }

    if (token) {
        requestHeaders.set("Authorization", `Bearer ${token}`);
    }

    let response: Response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...requestOptions,
            headers: requestHeaders,
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch {
        throw new ApiError(
            "Unable to connect to the server. Check that the backend is running.",
            0,
        );
    }

    const responseText = await response.text();

    let responseData: unknown;

    if (responseText) {
        try {
            responseData = JSON.parse(responseText);
        } catch {
            throw new ApiError(
                "The server returned an invalid response.",
                response.status,
            );
        }
    }

    if (!response.ok) {
        let message = `Request failed with status ${response.status}.`;

        if (
            typeof responseData === "object" &&
            responseData !== null &&
            "message" in responseData &&
            typeof responseData.message === "string"
        ) {
            message = responseData.message;
        }

        throw new ApiError(message, response.status);
    }

    return responseData as T;
}