import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { uploadVideo } from "../api/video.api";

export default function UploadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [serverError, setServerError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { title: "", description: "" },
  });

  const onSubmit = async (data) => {
    setServerError("");

    const videoFile = data.videoFile?.[0];
    const thumbnailFile = data.thumbnail?.[0];

    if (!videoFile) {
      setServerError("A video file is required.");
      return;
    }
    if (!thumbnailFile) {
      setServerError("A thumbnail is required.");
      return;
    }

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("videoFile", videoFile);
    formData.append("thumbnail", thumbnailFile);

    try {
      setUploadProgress(0);
      const video = await uploadVideo(formData, {
        onUploadProgress: (e) => {
          if (e.total) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      });
      navigate(`/watch/${video._id}`);
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Upload failed. Please try again."
      );
      setUploadProgress(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-lg font-semibold mb-6">Upload a video</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="videoFile" className="block text-sm mb-1 text-neutral-300">
            Video file
          </label>
          <input
            id="videoFile"
            type="file"
            accept="video/*"
            className="w-full text-sm text-neutral-400 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-neutral-200 hover:file:bg-neutral-700"
            {...register("videoFile", { required: "A video file is required" })}
          />
          {errors.videoFile && (
            <p className="text-red-400 text-sm mt-1">{errors.videoFile.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="thumbnail" className="block text-sm mb-1 text-neutral-300">
            Thumbnail
          </label>
          <input
            id="thumbnail"
            type="file"
            accept="image/*"
            className="w-full text-sm text-neutral-400 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-neutral-200 hover:file:bg-neutral-700"
            {...register("thumbnail", { required: "A thumbnail is required" })}
          />
          {errors.thumbnail && (
            <p className="text-red-400 text-sm mt-1">{errors.thumbnail.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="title" className="block text-sm mb-1 text-neutral-300">
            Title
          </label>
          <input
            id="title"
            type="text"
            className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 focus:outline-none focus:border-brand"
            {...register("title", { required: "Title is required" })}
          />
          {errors.title && (
            <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm mb-1 text-neutral-300">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 focus:outline-none focus:border-brand"
            {...register("description", { required: "Description is required" })}
          />
          {errors.description && (
            <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {uploadProgress !== null && (
          <div>
            <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-brand transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {uploadProgress < 100 ? `Uploading… ${uploadProgress}%` : "Processing…"}
            </p>
          </div>
        )}

        {serverError && <p className="text-red-400 text-sm">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-brand hover:bg-brand-light transition-colors py-2 font-medium disabled:opacity-50"
        >
          {isSubmitting ? "Uploading…" : "Upload"}
        </button>
      </form>

      {user && (
        <p className="text-xs text-neutral-500 mt-4">
          Publishing as <span className="text-neutral-300">@{user.username}</span>.
          Manage all your videos afterward in{" "}
          <button
            type="button"
            onClick={() => navigate("/studio")}
            className="text-brand-light hover:underline"
          >
            Studio
          </button>
          .
        </p>
      )}
    </div>
  );
}
