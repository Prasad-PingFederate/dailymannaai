import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
        return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    try {
        // Security check: only allow images
        const ext = path.extname(filePath).toLowerCase();
        const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"];

        if (!allowedExts.includes(ext)) {
            return NextResponse.json({ error: "Invalid file type" }, { status: 403 });
        }

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);

        const contentType = ext === ".svg" ? "image/svg+xml" : `image/${ext.slice(1)}`;

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000",
            },
        });
    } catch (error: any) {
        console.error("Local Image Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
