import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../api/auth";
import { ApiError } from "../api/client";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("")
}
