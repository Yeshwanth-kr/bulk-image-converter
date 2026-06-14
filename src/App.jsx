import { useState } from "react";
import { runBatchConversion } from "./utils/converter";

export default function App() {
  const [files, setFiles] = useState([]);
  const [isDevMode, setIsDevMode] = useState(false);
  const [outputFormat, setOutputFormat] = useState("jpg"); // jpg, png, webp
  const [generateBreakpoints, setGenerateBreakpoints] = useState(true);
  const [quality, setQuality] = useState(0.85);
  const [isProcessing, setIsProcessing] = useState(false);

  const PAYMENT_CONFIG = {
    upiId: import.meta.env.VITE_UPI_ID || "",
    payeeName: import.meta.env.VITE_PAYEE_NAME || "Developer",
  };

  const defaultBreakpoints = [444, 553, 1100];

  const formatSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

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
        status: "waiting",
      }));

    setFiles((prev) => [...prev, ...validImages]);
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearQueue = () => {
    setFiles([]);
  };

  const handleConversionProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
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
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bulk_converted_assets_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();

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

  const renderStatusBadge = (status) => {
    const matrix = {
      waiting: isDevMode
        ? "bg-slate-800 text-slate-400 border-slate-700"
        : "bg-gray-100 text-gray-600 border-gray-200",
      processing: "bg-amber-50 text-amber-600 border-amber-200 animate-pulse",
      completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
      error: "bg-rose-50 text-rose-600 border-rose-200",
    };
    return (
      <span
        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${matrix[status] || matrix.waiting}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
        isDevMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"
      }`}
    >
      {/* Dynamic Navbar Theme Block */}
      <nav
        className={`border-b max-w-full px-6 py-4 flex items-center justify-between shadow-sm transition-colors duration-300 ${
          isDevMode
            ? "bg-slate-900 border-slate-800"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center space-x-2">
          <span
            className={`text-xl font-bold tracking-tight transition-all ${
              isDevMode
                ? "text-emerald-400"
                : "bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"
            }`}
          >
            BulkImageConvert
          </span>
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
              isDevMode
                ? "bg-emerald-950 text-emerald-400"
                : "bg-indigo-50 text-indigo-700"
            }`}
          >
            v1.0 Local
          </span>
        </div>

        <button
          onClick={() => {
            const nextMode = !isDevMode;
            setIsDevMode(nextMode);
            setOutputFormat(nextMode ? "webp" : "jpg");
          }}
          className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all border ${
            isDevMode
              ? "bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          {isDevMode ? "🛠️ Developer Mode: ON" : "⚙️ Switch to Developer Mode"}
        </button>
      </nav>

      {/* Main Container Workspace */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Block: File Dropzone Queue */}
          <div className="md:col-span-2 space-y-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all relative group shadow-sm ${
                isDevMode
                  ? "border-slate-800 bg-slate-900 hover:border-emerald-500"
                  : "border-slate-300 bg-white hover:border-indigo-500"
              }`}
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
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-between mx-auto shadow-sm transition-colors ${
                    isDevMode
                      ? "bg-slate-800 text-emerald-400 group-hover:bg-slate-700"
                      : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
                  }`}
                >
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
                  <p
                    className={`text-sm font-semibold ${isDevMode ? "text-slate-200" : "text-slate-700"}`}
                  >
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
              <div
                className={`border rounded-xl overflow-hidden shadow-sm transition-colors duration-300 ${
                  isDevMode
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                <div
                  className={`px-5 py-4 border-b flex items-center justify-between ${
                    isDevMode
                      ? "bg-slate-900/50 border-slate-800"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <h2
                    className={`text-sm font-bold ${isDevMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Upload Queue ({files.length} files)
                  </h2>
                  <button
                    onClick={clearQueue}
                    className="text-xs text-rose-500 font-semibold hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                  {files.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between space-x-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium truncate ${isDevMode ? "text-slate-200" : "text-slate-800"}`}
                        >
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
                          className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-slate-800 transition-colors disabled:opacity-30"
                          aria-label={`Remove ${item.name}`}
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

          {/* Right Block: Configuration Control Panel Deck */}
          <div className="space-y-6">
            <div
              className={`border rounded-xl p-6 shadow-sm space-y-6 transition-colors duration-300 ${
                isDevMode
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200"
              }`}
            >
              <div>
<h2 className={`text-xs font-bold uppercase tracking-wider mb-3 transition-colors duration-300 ${
  isDevMode ? 'text-slate-400' : 'text-slate-600'
}`}>
  CONVERSION PROFILE
</h2>

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
                  <div className="space-y-4 bg-slate-950 text-slate-200 p-4 rounded-lg border border-slate-800">
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1.5">
                        Output Format Selector
                      </label>
                      <select
                        value={outputFormat}
                        onChange={(e) => setOutputFormat(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 pr-8 text-sm font-medium text-emerald-400 focus:outline-none focus:border-emerald-500 cursor-pointer"
                        aria-label="Developer configuration selector"
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
                            className="mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-800 focus:ring-0"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">
                              Generate Responsive Folders
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Creates sub-folder layouts containing 444px,
                              553px, and 1100px variants inside the ZIP.
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
                        className="w-full accent-emerald-400 bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer"
                        aria-label="Compression canvas slider quality factor"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleConversionProcess}
                disabled={files.length === 0 || isProcessing}
                className={`w-full py-3.5 px-4 font-bold text-sm rounded-xl transition-all duration-200 shadow-md flex items-center justify-center space-x-2 ${
                  files.length === 0 || isProcessing
                    ? isDevMode
                      ? "bg-slate-800 text-slate-600 cursor-not-allowed shadow-none"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    : isDevMode
                      ? "bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-950/20 hover:brightness-110 hover:scale-[1.01] cursor-pointer"
                      : "bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-100 hover:brightness-105 hover:scale-[1.01] cursor-pointer"
                }`}
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
                    </svg>
                    <span>Processing Matrix Streams...</span>
                  </>
                ) : (
                  <span>⚡ Convert Batch & Download ZIP</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
      {/* Micro-Donation & Value Proposition Banner */}
      <section className="max-w-6xl mx-auto px-4 mt-12">
        <div className="bg-linear-to-r from-blue-600 to-indigo-700 rounded-xl p-6 md:p-8 text-white shadow-lg text-center md:text-left md:flex md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">
              Saved manual editing hours? ☕
            </h3>
            <p className="text-sm text-blue-100 max-w-2xl">
              This tool is completely free, private, and contains no intrusive
              pop-up ads.
              <br />
              If you want to keep this serverless tool fast and secure. consider
              supporting the developer with a small contribution!
            </p>
          </div>
          <div className="mt-6 md:mt-0 flex flex-col sm:flex-row items-center justify-center gap-4 shrink-0">
            {/* UPI Intent Gateway Option */}
            <a
              href={`upi://pay?pa=${PAYMENT_CONFIG.upiId}&pn=${encodeURIComponent(PAYMENT_CONFIG.payeeName)}&cu=INR`}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm px-6 py-3 rounded-lg shadow transition block w-full sm:w-auto text-center"
            >
              ⚡ Pay via UPI (₹20 / ₹50)
            </a>
          </div>
        </div>
      </section>
      {/* Semantic FAQ Section for Technical SEO */}
      <section
        className={`max-w-4xl mx-auto px-4 mt-16 pt-12 border-t transition-colors duration-300 ${
          isDevMode ? "border-slate-900" : "border-slate-200"
        }`}
      >
        <h2
          className={`text-xl font-bold tracking-tight mb-6 ${isDevMode ? "text-slate-200" : "text-slate-800"}`}
        >
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div
            className={`p-5 rounded-xl border shadow-sm transition-colors ${
              isDevMode
                ? "bg-slate-900 border-slate-800 text-slate-300"
                : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            <h3 className="font-semibold text-sm">
              Why do transparent backgrounds turn white?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Standard JPEG formats do not support alpha transparency channels.
              Our client-side rendering pipeline automatically layers a clean
              white background under your graphics to stop portals from breaking
              or corrupting your transparent areas into black blocks.
            </p>
          </div>
          <div
            className={`p-5 rounded-xl border shadow-sm transition-colors ${
              isDevMode
                ? "bg-slate-900 border-slate-800 text-slate-300"
                : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            <h3 className="font-semibold text-sm">
              How do responsive folders work?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              When Developer Mode is switched on, a single image splits into
              discrete production sizes:{" "}
              <code
                className={`px-1 rounded  ${isDevMode ? "bg-slate-800 text-emerald-400" : "bg-slate-100 text-indigo-600"}`}
              >
                444px
              </code>
              ,{" "}
              <code
                className={`px-1 rounded  ${isDevMode ? "bg-slate-800 text-emerald-400" : "bg-slate-100 text-indigo-600"}`}
              >
                553px
              </code>
              , and{" "}
              <code
                className={`px-1 rounded  ${isDevMode ? "bg-slate-800 text-emerald-400" : "bg-slate-100 text-indigo-600"}`}
              >
                1100px
              </code>
              . The utility generates dynamic folder trees within the ZIP,
              stopping image blur and saving manual export steps.
            </p>
          </div>
          <div
            className={`p-5 rounded-xl border shadow-sm md:col-span-2 transition-colors ${
              isDevMode
                ? "bg-slate-900 border-slate-800 text-slate-300"
                : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            <h3 className="font-semibold text-sm">
              Is batch processing safe for sensitive files?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Entirely. Your photos are decoded directly into native local
              canvas memory layers. Because no third-party APIs, remote servers,
              or external tracking analytics parse your data stream, processing
              runs with complete privacy offline.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Branding Wrapper */}
      <footer
        className={`mt-20 py-8 border-t text-center max-w-full transition-colors duration-300 ${
          isDevMode ? "border-slate-900" : "border-slate-200"
        }`}
      >
        <p className="text-xs text-slate-500 font-medium">
          BulkImageConvert • 100% Private Client-Side Canvas System • No server
          uploads.
        </p>
      </footer>
    </div>
  );
}
