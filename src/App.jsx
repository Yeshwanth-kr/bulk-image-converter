import { useState } from "react";
import { runBatchConversion } from "./utils/converter";

export default function App() {
  const [files, setFiles] = useState([]);
  const [isDevMode, setIsDevMode] = useState(false);
  const [outputFormat, setOutputFormat] = useState("jpg"); // jpg, png, webp
  const [generateBreakpoints, setGenerateBreakpoints] = useState(true);
  const [quality, setQuality] = useState(0.85);
  const [isProcessing, setIsProcessing] = useState(false);

  const defaultBreakpoints = [444, 553, 1100];

  // Format file bytes into human-readable strings
  const formatSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Intercept and load files into local component state
  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer
      ? Array.from(e.dataTransfer.files)
      : Array.from(e.target.files);

    const validImages = droppedFiles
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        file: file,
        name: file.name,
        size: file.size,
        status: "waiting", // waiting, processing, completed, error
      }));

    setFiles((prev) => [...prev, ...validImages]);
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearQueue = () => {
    setFiles([]);
  };

  // Run conversion stream and trigger automated client download
  const handleConversionProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    // Mark all items as processing in UI
    setFiles((prev) => prev.map((f) => ({ ...f, status: "processing" })));

    try {
      const config = {
        isDevMode,
        generateBreakpoints,
        outputFormat,
        quality,
        customBreakpoints: defaultBreakpoints,
      };

      const zipBlob = await runBatchConversion(files, config);

      // Create download pipeline anchor link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bulk_converted_assets_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();

      // Cleanup browser engine reference memory strings
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFiles((prev) => prev.map((f) => ({ ...f, status: "completed" })));
    } catch (error) {
      console.error("Batch pipeline execution failed:", error);
      setFiles((prev) => prev.map((f) => ({ ...f, status: "error" })));
    } finally {
      setIsProcessing(false);
    }
  };

  // Dynamic status badge renderer
  const renderStatusBadge = (status) => {
    const matrix = {
      waiting: "bg-gray-100 text-gray-600 border-gray-200",
      processing: "bg-amber-50 text-amber-600 border-amber-200 animate-pulse",
      completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
      error: "bg-rose-50 text-rose-600 border-rose-200",
    };
    const style = matrix[status] || matrix.waiting;
    return (
      <span
        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${style}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Upper Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 max-w-full px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold tracking-tight bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            BulkImageConvert
          </span>
          <span className="bg-indigo-50 text-indigo-700 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
            v1.0 Local
          </span>
        </div>

        {/* Developer Mode Toggle Switch */}
        <button
          onClick={() => {
            const nextMode = !isDevMode;
            setIsDevMode(nextMode);
            setOutputFormat(nextMode ? "webp" : "jpg");
          }}
          className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all border ${
            isDevMode
              ? "bg-slate-900 text-emerald-400 border-slate-900 shadow"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          {isDevMode ? "🛠️ Developer Mode: ON" : "⚙️ Switch to Developer Mode"}
        </button>
      </nav>

      {/* Primary Workspace Box */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Block: File Interception Input Queue */}
          <div className="md:col-span-2 space-y-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white rounded-xl p-8 text-center cursor-pointer transition-colors relative group shadow-sm"
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileDrop}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Upload source images for conversion"
              />
              <div className="space-y-3">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-between mx-auto shadow-sm group-hover:bg-indigo-100 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Drag and drop your images here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports PNG, JPEG, WEBP, AVIF (Batch processing up to 50
                    files)
                  </p>
                </div>
              </div>
            </div>

            {/* Middle Action Queue Listing Row */}
            {files.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-700">
                    Upload Queue ({files.length} files)
                  </h2>
                  <button
                    onClick={clearQueue}
                    className="text-xs text-rose-600 font-semibold hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {files.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between space-x-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatSize(item.size)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {renderStatusBadge(item.status)}
                        <button
                          onClick={() => removeFile(item.id)}
                          disabled={isProcessing}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-50 transition-colors disabled:opacity-30"
                          aria-label={`Remove ${item.name} from processing list`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Block: Configuration & Rules Control Panel Deck */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Conversion Profile
                </h2>

                {/* Standard Layout Options Set */}
                {!isDevMode ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => setOutputFormat("jpg")}
                      className={`w-full text-left p-3 rounded-lg border text-sm font-medium transition-all ${
                        outputFormat === "jpg"
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 font-semibold"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      Convert to Standard JPG
                      <span className="block text-xs font-normal text-slate-500 mt-0.5">
                        Best for official registration and forms
                      </span>
                    </button>
                    <button
                      onClick={() => setOutputFormat("png")}
                      className={`w-full text-left p-3 rounded-lg border text-sm font-medium transition-all ${
                        outputFormat === "png"
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 font-semibold"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      Convert to Clear PNG
                      <span className="block text-xs font-normal text-slate-500 mt-0.5">
                        Preserves transparency lines and quality
                      </span>
                    </button>
                  </div>
                ) : (
                  /* Developer Configuration Options Box Set */
                  <div className="space-y-4 bg-slate-900 text-slate-200 p-4 rounded-lg border border-slate-800">
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1.5">
                        Output Format Selector
                      </label>
                      <select
                        value={outputFormat}
                        onChange={(e) => setOutputFormat(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm font-medium text-emerald-400 focus:outline-none focus:border-emerald-500"
                        aria-label="Developer mode output file type configuration selector"
                      >
                        <option value="webp">WebP (Lighthouse Max)</option>
                        <option value="jpg">JPEG (Standard Form)</option>
                        <option value="png">PNG (Lossless Asset)</option>
                      </select>
                    </div>

                    {outputFormat === "webp" && (
                      <div className="space-y-3 pt-2 border-t border-slate-800">
                        <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={generateBreakpoints}
                            onChange={(e) =>
                              setGenerateBreakpoints(e.target.checked)
                            }
                            className="mt-0.5 rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-0"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">
                              Generate Responsive Folders
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Creates separate folder outputs containing 444px,
                              553px, and 1100px variants inside the ZIP map.
                            </span>
                          </div>
                        </label>
                      </div>
                    )}

                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <div className="flex justify-between text-xs font-medium text-slate-400">
                        <label>Compression Engine Factor</label>
                        <span className="text-emerald-400 font-bold">
                          {Math.round(quality * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={quality * 100}
                        onChange={(e) =>
                          setQuality(Number(e.target.value) / 100)
                        }
                        className="w-full accent-emerald-400 bg-slate-700 h-1 rounded-lg appearance-none cursor-pointer"
                        aria-label="Raw compression canvas quality output slider factor"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Engine Compilation Dispatch Execution Triggers */}
              <button
                onClick={handleConversionProcess}
                disabled={files.length === 0 || isProcessing}
                className="w-full py-3.5 px-4 bg-linear-to-r from-indigo-600 to-violet-600 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-100 disabled:shadow-none flex items-center justify-center space-x-2 hover:brightness-105 active:scale-[0.99]"
              >
                {isProcessing ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <circle
                        className="opacity-75"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="fill"
                      />
                    </svg>
                    <span>Processing Matrix Streams...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Convert Batch & Download ZIP</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding Wrapper */}
      <footer className="mt-20 py-8 border-t border-slate-200 text-center max-w-full">
        <p className="text-xs text-slate-500 font-medium">
          BulkImageConvert • 100% Private Client-Side Canvas System • No server
          uploads.
        </p>
      </footer>
    </div>
  );
}
