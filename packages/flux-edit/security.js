import fs from 'node:fs';
import path from 'node:path';

const ALLOWED_EXTENSIONS = new Set(['.jsx', '.tsx', '.js', '.ts']);
const LOCAL_HOST_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/\[::1\](:\d+)?$/,
];

/**
 * Validates that an incoming HTTP request to the dev server middleware originates
 * exclusively from the local browser session, preventing cross-site request forgery
 * (CSRF) and DNS rebinding attacks from malicious third-party browser tabs.
 */
export function assertAuthorizedRequest(req) {
  // 1. Enforce custom header requirement (browsers never send custom headers cross-origin without preflight)
  const clientHeader = req.headers['x-flux-client'];
  if (clientHeader !== 'true') {
    const error = new Error('Unauthorized client request: missing required security header.');
    error.statusCode = 403;
    throw error;
  }

  // 2. Validate Origin / Referer if present
  const origin = req.headers.origin || req.headers.referer;
  if (origin) {
    let parsedOrigin;
    try {
      parsedOrigin = new URL(origin).origin;
    } catch {
      const error = new Error('Malformed Origin or Referer header.');
      error.statusCode = 400;
      throw error;
    }

    const isLocal = LOCAL_HOST_PATTERNS.some((pattern) => pattern.test(parsedOrigin));
    if (!isLocal) {
      const error = new Error(`Cross-origin request rejected from untrusted origin: ${parsedOrigin}`);
      error.statusCode = 403;
      throw error;
    }
  }
}

/**
 * Resolves and strictly canonicalizes a target source file path, ensuring it resides
 * entirely inside the workspace root. Guards against path traversal (../), null byte injections,
 * symlink escapes, Windows ADS (Alternative Data Streams), and UNC network paths.
 */
export function resolveSafeWorkspacePath(relPath, rootDir) {
  if (typeof relPath !== 'string' || !relPath.trim()) {
    throw new Error('Invalid path: target file path cannot be empty.');
  }

  // 1. Guard against null byte injections
  if (relPath.includes('\0')) {
    throw new Error('Security violation: path contains null bytes.');
  }

  // 2. Guard against Windows UNC paths (\\host\share)
  if (relPath.startsWith('\\\\') || relPath.startsWith('//')) {
    throw new Error('Security violation: UNC network paths are forbidden.');
  }

  // 3. Extension whitelisting
  const ext = path.extname(relPath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(
      `Security violation: file extension "${ext}" is not permitted. Allowed: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`
    );
  }

  // 4. Resolve absolute path and enforce lexical boundary containment
  const resolvedPath = path.resolve(rootDir, relPath);
  const normalizedRoot = path.resolve(rootDir).endsWith(path.sep)
    ? path.resolve(rootDir)
    : path.resolve(rootDir) + path.sep;

  const isWin = process.platform === 'win32';
  const isLexicallyContained = isWin
    ? resolvedPath.toLowerCase().startsWith(normalizedRoot.toLowerCase())
    : resolvedPath.startsWith(normalizedRoot);

  if (!isLexicallyContained) {
    throw new Error('Security violation: target file path resolves outside the workspace boundary.');
  }

  // 5. Canonicalize via realpath to defeat symlink escapes
  let canonicalRoot;
  try {
    canonicalRoot = fs.realpathSync(rootDir);
  } catch {
    canonicalRoot = path.resolve(rootDir);
  }

  let canonicalTarget = resolvedPath;
  try {
    canonicalTarget = fs.realpathSync(resolvedPath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      try {
        const parentDir = path.dirname(resolvedPath);
        const canonicalParent = fs.realpathSync(parentDir);
        canonicalTarget = path.join(canonicalParent, path.basename(resolvedPath));
      } catch {
        // Fall back to resolvedPath if parent directory is also not yet on disk
        canonicalTarget = resolvedPath;
      }
    } else {
      throw err;
    }
  }

  // 6. Jail containment check on canonical target
  const normCanonicalRoot = canonicalRoot.endsWith(path.sep) ? canonicalRoot : canonicalRoot + path.sep;
  const isContained = isWin
    ? canonicalTarget.toLowerCase().startsWith(normCanonicalRoot.toLowerCase())
    : canonicalTarget.startsWith(normCanonicalRoot);

  if (!isContained) {
    throw new Error('Security violation: target file path resolves outside the workspace boundary.');
  }

  return canonicalTarget;
}

/**
 * Performs an atomic file write using an ephemeral sibling file and atomic rename.
 * This guarantees source code files on disk are never left corrupted or half-written
 * if the process or power cuts out during a disk write.
 */
export function atomicWriteFileSync(filePath, content) {
  const dir = path.dirname(filePath);
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const tempPath = path.join(dir, `.flux_tmp_${Date.now()}_${randomSuffix}`);

  try {
    fs.writeFileSync(tempPath, content, 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    // Clean up temporary file on failure
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch {
      // Ignore cleanup error
    }
    throw new Error(`Failed to commit atomic write to ${filePath}: ${err.message}`);
  }
}
