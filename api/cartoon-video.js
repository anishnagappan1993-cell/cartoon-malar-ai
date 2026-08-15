import { fal } from "@fal-ai/client";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST only"
    });
  }

  try {
    const { videoUrl, style } = req.body || {};

    if (!videoUrl) {
      return res.status(400).json({
        error: "Please provide videoUrl"
      });
    }

    if (!process.env.FAL_KEY) {
      return res.status(500).json({
        error: "FAL_KEY is missing"
      });
    }

    fal.config({
      credentials: process.env.FAL_KEY
    });

    const result = await fal.subscribe(
      "fal-ai/hunyuan-video/video-to-video",
      {
        input: {
          video_url: videoUrl,
          prompt: `Transform this video into a high quality ${style || "3D cartoon"} animation. Keep the same person, movement, clothing, expressions and camera motion. Make the cartoon smooth and consistent.`
        }
      }
    );

    return res.status(200).json({
      success: true,
      result: result.data
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Generation failed"
    });
  }
      }
