import { fal } from "@fal-ai/client";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { videoUrl, style } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        error: "Video URL is required"
      });
    }

    const selectedStyle = style || "3D Cartoon";

    const prompt = `
Transform this reference video into a high-quality
${selectedStyle} animated cartoon.

Preserve the person's identity, facial features,
hair, clothing, body movement, camera movement,
scene composition and timing as much as possible.

Create consistent characters and smooth animation
throughout the entire video.

Premium cinematic 3D cartoon appearance.
Keep the original action and story.

Preserve the original audio, voice, dialogue
and music whenever supported.
`;

    const result = await fal.subscribe(
      "fal-ai/ltx-2.3-22b/reference-video-to-video",
      {
        input: {
          prompt,
          video_url: videoUrl,
          match_video_length: true,
          match_input_fps: true,
          use_multiscale: true
        }
      }
    );

    const outputVideo = result?.data?.video?.url;

    if (!outputVideo) {
      return res.status(500).json({
        error: "AI did not return a video"
      });
    }

    return res.status(200).json({
      success: true,
      videoUrl: outputVideo,
      style: selectedStyle
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "AI processing failed"
    });
  }
  }
