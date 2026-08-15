import { fal } from "@fal-ai/client";

const MAX_BYTES = 18 * 1024 * 1024;

function send(res, status, body) {
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Browser permission check
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // POST only
  if (req.method !== "POST") {
    return send(res, 405, {
      success: false,
      error: "POST only"
    });
  }

  // API key check
  if (!process.env.FAL_KEY) {
    return send(res, 500, {
      success: false,
      error: "FAL_KEY is missing"
    });
  }

  try {
    const {
      dataUrl,
      style = "3D Cartoon"
    } = req.body || {};

    // Check video
    if (!dataUrl || typeof dataUrl !== "string") {
      return send(res, 400, {
        success: false,
        error: "Please select a video"
      });
    }

    // Check base64 video
    const match = dataUrl.match(
      /^data:(video\/[a-zA-Z0-9.+-]+);base64,(.+)$/s
    );

    if (!match) {
      return send(res, 400, {
        success: false,
        error: "Invalid video format"
      });
    }

    const mime = match[1];

    // Supported formats
    const allowed = [
      "video/mp4",
      "video/webm",
      "video/quicktime"
    ];

    if (!allowed.includes(mime)) {
      return send(res, 400, {
        success: false,
        error: "Please use MP4, WebM or MOV video"
      });
    }

    // Convert base64 → file
    const buffer = Buffer.from(match[2], "base64");

    // Size limit
    if (buffer.length > MAX_BYTES) {
      return send(res, 413, {
        success: false,
        error: "Video is too large. Please use a video under 18 MB."
      });
    }

    // Configure Fal AI
    fal.config({
      credentials: process.env.FAL_KEY
    });

    // Upload video
    const extension =
      mime === "video/quicktime"
        ? "mov"
        : mime.split("/")[1];

    const file = new File(
      [buffer],
      `cartoon-input.${extension}`,
      { type: mime }
    );

    const videoUrl = await fal.storage.upload(file);

    // Cartoon prompt
    const prompt = `
Transform this video into a beautiful professional ${style} cartoon animation.

Keep the same person, face, hairstyle, clothing, body movement,
hand movement, camera movement, timing and important objects.

Keep the character consistent from frame to frame.

Make the animation smooth, clean, colorful and high quality.

Do not add extra people.
Do not remove important objects.
Do not change the person's identity.

Create a polished vertical social-media friendly cartoon video.
`;

    // Generate cartoon video
    const result = await fal.subscribe(
      "fal-ai/hunyuan-video/video-to-video",
      {
        input: {
          prompt,
          video_url: videoUrl,
          aspect_ratio: "9:16",
          resolution: "720p",
          num_frames: 129,
          strength: 0.85,
          enable_safety_checker: true
        },

        logs: true,

        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.forEach((log) => {
              console.log(log.message);
            });
          }
        }
      }
    );

    // Get generated video
    const outputUrl = result.data?.video?.url;

    if (!outputUrl) {
      throw new Error(
        "AI did not return a video"
      );
    }

    return send(res, 200, {
      success: true,
      video: outputUrl,
      requestId: result.requestId || null
    });

  } catch (error) {

    console.error(
      "Cartoon video error:",
      error
    );

    return send(res, 500, {
      success: false,
      error:
        error?.message ||
        "Video generation failed"
    });
  }
        }
