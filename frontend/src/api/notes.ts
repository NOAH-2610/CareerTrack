import { apiRequest } from "./client";
import type { Note } from "../types";

export interface NoteInput {
    content: string;
}

export interface NoteListResponse {
    message: string;
    count: number;
    notes: Note[];
}

export interface NoteResponse {
    message: string;
    note: Note;
}

export function getNotes(
    token: string,
    applicationId: number,
): Promise<NoteListResponse> {
    return apiRequest<NoteListResponse>(
        `/applications/${applicationId}/notes`,
        {
            method: "GET",
            token,
        },
    );
}

export function getNote(
    token: string,
    applicationId: number,
    noteId: number,
): Promise<NoteResponse> {
    return apiRequest<NoteResponse>(
        `/applications/${applicationId}/notes/${noteId}`,
        {
            method: "GET",
            token,
        },
    );
}

export function createNote(
    token: string,
    applicationId: number,
    input: NoteInput,
): Promise<NoteResponse> {
    return apiRequest<NoteResponse>(
        `/applications/${applicationId}/notes`,
        {
            method: "POST",
            token,
            body: input,
        },
    );
}

export function updateNote(
    token: string,
    applicationId: number,
    noteId: number,
    input: NoteInput,
): Promise<NoteResponse> {
    return apiRequest<NoteResponse>(
        `/applications/${applicationId}/notes/${noteId}`,
        {
            method: "PATCH",
            token,
            body: input,
        },
    );
}

export function deleteNote(
    token: string,
    applicationId: number,
    noteId: number,
): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(
        `/applications/${applicationId}/notes/${noteId}`,
        {
            method: "DELETE",
            token,
        },
    );
}