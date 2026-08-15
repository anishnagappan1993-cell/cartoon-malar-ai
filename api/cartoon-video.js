import { fal } from "@fal-ai/client";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // POST only
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST only"
    });
  }

  try {
    const {
      videoUrl,
      style = "3D Cartoon"
    } = req.body || {};

    // Check video
    if (!videoUrl) {
      return res.status(400).json({
        error: "Please provide videoUrl"
      });
    }

    // Check API key
    if (!process.env.FAL_KEY) {
      return res.status(500).json({
        error: "FAL_KEY is missing"
      });
    }

    // Configure fal
    fal.config({
      credentials: process.env.FAL_KEY
    });

    // Cartoon prompt
    const prompt = `
Transform this reference video into a high-quality animated cartoon.

Cartoon style: ${style}

Keep the same person and preserve:
- facial features
- hairstyle
- clothing
- body movement
- hand movement
- camera movement
- scene composition
- timing
- background composition

Create a consistent cartoon character throughout the entire video.

Make the animation smooth, detailed and visually attractive.

Do not change the person's identity.
Do not add extra people.
Do not remove important objects.

The final result should look like a polished professional cartoon video.
`;

    // Generate video
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

    // Return generated video
    return res.status(200).json({
      success: true,
      video: result.data?.video?.url || null,
      requestId: result.requestId || null
    });

  } catch (error) {
    console.error("Cartoon video error:", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Video generation failed"
    });
  }
      }
