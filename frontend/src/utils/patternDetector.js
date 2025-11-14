/**
 * Pattern Detection Utilities for Log Analysis
 * Detects common patterns in log files to help with rule generation
 */

// IP Address patterns (IPv4 and IPv6)
const IPV4_PATTERN = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g
const IPV6_PATTERN = /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g

// Timestamp patterns
const TIMESTAMP_PATTERNS = [
  /\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/g, // ISO 8601
  /\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}/g, // MM/DD/YYYY HH:MM:SS
  /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/g, // YYYY-MM-DD HH:MM:SS
  /\[?\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2}/g, // Apache log format
]

// Error patterns
const ERROR_PATTERNS = [
  { pattern: /error|Error|ERROR/i, name: 'Error Keywords' },
  { pattern: /exception|Exception|EXCEPTION/i, name: 'Exception Keywords' },
  { pattern: /fail|Fail|FAIL|failed|Failed|FAILED/i, name: 'Failure Keywords' },
  { pattern: /warn|Warn|WARN|warning|Warning|WARNING/i, name: 'Warning Keywords' },
  { pattern: /critical|Critical|CRITICAL/i, name: 'Critical Keywords' },
  { pattern: /denied|Denied|DENIED|forbidden|Forbidden|FORBIDDEN/i, name: 'Access Denied' },
  { pattern: /unauthorized|Unauthorized|UNAUTHORIZED/i, name: 'Unauthorized Access' },
]

// HTTP patterns
const HTTP_PATTERNS = [
  { pattern: /(?:GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+\/[^\s]*/gi, name: 'HTTP Methods' },
  { pattern: /HTTP\/\d\.\d/g, name: 'HTTP Versions' },
  { pattern: /\d{3}\s+(?:OK|Not Found|Forbidden|Unauthorized|Internal Server Error)/gi, name: 'HTTP Status' },
]

// User/Account patterns
const USER_PATTERNS = [
  { pattern: /user[=:]\s*[\w@.-]+/gi, name: 'User Fields' },
  { pattern: /username[=:]\s*[\w@.-]+/gi, name: 'Username Fields' },
  { pattern: /account[=:]\s*[\w@.-]+/gi, name: 'Account Fields' },
  { pattern: /email[=:]\s*[\w@.-]+/gi, name: 'Email Addresses' },
]

// File/Path patterns
const PATH_PATTERNS = [
  { pattern: /[\/\\][\w\/\\\.-]+\.(?:log|txt|json|csv|xml|conf|config)/gi, name: 'File Paths' },
  { pattern: /[\/\\][\w\/\\\.-]+/gi, name: 'Directory Paths' },
]

// Port patterns
const PORT_PATTERN = /:\d{1,5}\b/g

// UUID patterns
const UUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi

// Hash patterns (MD5, SHA1, SHA256)
const HASH_PATTERNS = [
  { pattern: /\b[0-9a-f]{32}\b/gi, name: 'MD5 Hashes' },
  { pattern: /\b[0-9a-f]{40}\b/gi, name: 'SHA1 Hashes' },
  { pattern: /\b[0-9a-f]{64}\b/gi, name: 'SHA256 Hashes' },
]

/**
 * Detect patterns in log lines
 * @param {string[]} logLines - Array of log lines
 * @returns {Object} Detected patterns
 */
export function detectPatterns(logLines) {
  if (!logLines || logLines.length === 0) {
    return {
      patterns: [],
      statistics: {},
      summary: 'No log lines to analyze'
    }
  }

  const text = logLines.join('\n')
  const patterns = []
  const statistics = {
    totalLines: logLines.length,
    totalCharacters: text.length,
    averageLineLength: Math.round(text.length / logLines.length),
  }

  // Detect IP addresses
  const ipv4Matches = text.match(IPV4_PATTERN) || []
  const ipv6Matches = text.match(IPV6_PATTERN) || []
  const uniqueIPs = [...new Set([...ipv4Matches, ...ipv6Matches])]
  
  if (uniqueIPs.length > 0) {
    patterns.push({
      type: 'ip_addresses',
      name: 'IP Addresses',
      icon: '🌐',
      count: uniqueIPs.length,
      samples: uniqueIPs.slice(0, 5),
      description: `${uniqueIPs.length} unique IP address${uniqueIPs.length > 1 ? 'es' : ''} found`,
      color: 'blue'
    })
    statistics.uniqueIPs = uniqueIPs.length
  }

  // Detect timestamps
  let timestampMatches = []
  TIMESTAMP_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern) || []
    timestampMatches.push(...matches)
  })
  const uniqueTimestamps = [...new Set(timestampMatches)]
  
  if (uniqueTimestamps.length > 0) {
    patterns.push({
      type: 'timestamps',
      name: 'Timestamps',
      icon: '🕐',
      count: uniqueTimestamps.length,
      samples: uniqueTimestamps.slice(0, 3),
      description: 'Timestamp patterns detected',
      color: 'purple'
    })
    statistics.hasTimestamps = true
  }

  // Detect errors
  const errorCounts = {}
  ERROR_PATTERNS.forEach(({ pattern, name }) => {
    const matches = text.match(pattern) || []
    if (matches.length > 0) {
      errorCounts[name] = matches.length
    }
  })
  
  if (Object.keys(errorCounts).length > 0) {
    const totalErrors = Object.values(errorCounts).reduce((a, b) => a + b, 0)
    patterns.push({
      type: 'errors',
      name: 'Error Patterns',
      icon: '⚠️',
      count: totalErrors,
      samples: Object.entries(errorCounts).map(([name, count]) => `${name}: ${count}`).slice(0, 3),
      description: `${totalErrors} error-related keywords found`,
      color: 'red',
      details: errorCounts
    })
    statistics.errorCount = totalErrors
  }

  // Detect HTTP patterns
  const httpMethods = text.match(HTTP_PATTERNS[0].pattern) || []
  const httpVersions = text.match(HTTP_PATTERNS[1].pattern) || []
  const httpStatus = text.match(HTTP_PATTERNS[2].pattern) || []
  
  if (httpMethods.length > 0 || httpVersions.length > 0 || httpStatus.length > 0) {
    patterns.push({
      type: 'http',
      name: 'HTTP Traffic',
      icon: '🌍',
      count: httpMethods.length,
      samples: [...new Set(httpMethods.slice(0, 3))],
      description: `${httpMethods.length} HTTP request${httpMethods.length > 1 ? 's' : ''} detected`,
      color: 'green',
      details: {
        methods: httpMethods.length,
        versions: httpVersions.length,
        statusCodes: httpStatus.length
      }
    })
    statistics.hasHTTP = true
  }

  // Detect user/account patterns
  let userMatches = []
  USER_PATTERNS.forEach(({ pattern }) => {
    const matches = text.match(pattern) || []
    userMatches.push(...matches)
  })
  const uniqueUsers = [...new Set(userMatches)]
  
  if (uniqueUsers.length > 0) {
    patterns.push({
      type: 'users',
      name: 'User/Account Fields',
      icon: '👤',
      count: uniqueUsers.length,
      samples: uniqueUsers.slice(0, 3).map(u => u.substring(0, 50)),
      description: `${uniqueUsers.length} user-related field${uniqueUsers.length > 1 ? 's' : ''} found`,
      color: 'yellow'
    })
    statistics.hasUsers = true
  }

  // Detect file paths
  const pathMatches = text.match(PATH_PATTERNS[0].pattern) || []
  const uniquePaths = [...new Set(pathMatches)]
  
  if (uniquePaths.length > 0) {
    patterns.push({
      type: 'paths',
      name: 'File/Directory Paths',
      icon: '📁',
      count: uniquePaths.length,
      samples: uniquePaths.slice(0, 3),
      description: `${uniquePaths.length} file path${uniquePaths.length > 1 ? 's' : ''} detected`,
      color: 'indigo'
    })
    statistics.hasPaths = true
  }

  // Detect ports
  const portMatches = text.match(PORT_PATTERN) || []
  const uniquePorts = [...new Set(portMatches.map(p => p.substring(1)))]
  
  if (uniquePorts.length > 0) {
    patterns.push({
      type: 'ports',
      name: 'Network Ports',
      icon: '🔌',
      count: uniquePorts.length,
      samples: uniquePorts.slice(0, 5).map(p => `:${p}`),
      description: `${uniquePorts.length} unique port${uniquePorts.length > 1 ? 's' : ''} detected`,
      color: 'cyan'
    })
    statistics.uniquePorts = uniquePorts.length
  }

  // Detect UUIDs
  const uuidMatches = text.match(UUID_PATTERN) || []
  const uniqueUUIDs = [...new Set(uuidMatches)]
  
  if (uniqueUUIDs.length > 0) {
    patterns.push({
      type: 'uuids',
      name: 'UUIDs',
      icon: '🆔',
      count: uniqueUUIDs.length,
      samples: uniqueUUIDs.slice(0, 2),
      description: `${uniqueUUIDs.length} UUID${uniqueUUIDs.length > 1 ? 's' : ''} found`,
      color: 'pink'
    })
    statistics.hasUUIDs = true
  }

  // Detect hashes
  let hashMatches = []
  HASH_PATTERNS.forEach(({ pattern }) => {
    const matches = text.match(pattern) || []
    hashMatches.push(...matches)
  })
  const uniqueHashes = [...new Set(hashMatches)]
  
  if (uniqueHashes.length > 0) {
    patterns.push({
      type: 'hashes',
      name: 'Hash Values',
      icon: '🔐',
      count: uniqueHashes.length,
      samples: uniqueHashes.slice(0, 2).map(h => `${h.substring(0, 16)}...`),
      description: `${uniqueHashes.length} hash value${uniqueHashes.length > 1 ? 's' : ''} detected`,
      color: 'orange'
    })
    statistics.hasHashes = true
  }

  // Detect log structure
  const commonSeparators = [',', '|', '\t', ';']
  const separatorCounts = {}
  commonSeparators.forEach(sep => {
    const count = text.split(sep).length - 1
    if (count > logLines.length * 0.5) { // Appears in at least 50% of lines
      separatorCounts[sep] = count
    }
  })
  
  if (Object.keys(separatorCounts).length > 0) {
    const mostCommon = Object.entries(separatorCounts).sort((a, b) => b[1] - a[1])[0]
    patterns.push({
      type: 'structure',
      name: 'Log Structure',
      icon: '📊',
      count: 0,
      samples: [`Separator: "${mostCommon[0]}" (${mostCommon[1]} occurrences)`],
      description: `Structured format detected (${mostCommon[0]} separated)`,
      color: 'gray'
    })
    statistics.structure = mostCommon[0]
  }

  return {
    patterns,
    statistics,
    summary: `Detected ${patterns.length} pattern type${patterns.length > 1 ? 's' : ''} in ${logLines.length} log lines`
  }
}

/**
 * Get pattern insights for rule generation
 * @param {Object} detectedPatterns - Result from detectPatterns()
 * @returns {string} Insights text for AI prompt
 */
export function getPatternInsights(detectedPatterns) {
  if (!detectedPatterns.patterns || detectedPatterns.patterns.length === 0) {
    return ''
  }

  const insights = ['Detected patterns in the log:']
  
  detectedPatterns.patterns.forEach(pattern => {
    insights.push(`- ${pattern.name}: ${pattern.description}`)
    if (pattern.samples && pattern.samples.length > 0) {
      insights.push(`  Examples: ${pattern.samples.slice(0, 2).join(', ')}`)
    }
  })

  return insights.join('\n')
}

