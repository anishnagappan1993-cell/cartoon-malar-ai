import { fal } from "@fal-ai/client";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { videoUrl, style } = req.body || {};

    if (!videoUrl) {
      return res.status(400).json({
        error: "Video URL is required"
      });
    }

    const selectedStyle = style || "3D Cartoon";

    const prompt = `
Transform this reference video into a high-quality animated cartoon video.

Style: ${selectedStyle}

Keep the same person, facial features, hair, clothing,
body movement, camera movement, scene composition and timing
as closely as possible.

Create a consistent cartoon character throughout the entire video.
Make the animation smooth, detailed and visually attractive.

High quality, clean character design, smooth motion,
cinematic lighting, detailed background.
`;

    const result = await fal.subscribe(
      "fal-ai/ltx-2.3-quality/reference-video-to-video",
      {
        input: {
          prompt: prompt,
          video_url: videoUrl
        },
        logs: true
      }
    );

    return res.status(200).json({
      success: true,
      video: result.data?.video || null,
      requestId: result.requestId
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Cartoon video generation failed"
    });
  }
      }
