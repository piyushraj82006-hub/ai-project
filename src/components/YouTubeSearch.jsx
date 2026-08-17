import { useState, useCallback } from 'react';
import { Search, Play, ExternalLink, Loader, Video, X } from 'lucide-react';
import { toast } from '../lib/toast';

/**
 * YouTube Video Search component
 * Uses the YouTube Data API v3 (requires VITE_YOUTUBE_API_KEY)
 * Falls back to embed-based search URL if no API key
 */
export default function YouTubeSearch({ documentTitle, keyConcepts }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  const handleSearch = useCallback(async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      if (API_KEY) {
        // Use YouTube Data API v3
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q + ' tutorial')}&type=video&videoDuration=medium&maxResults=12&key=${API_KEY}`
        );
        if (!response.ok) throw new Error('YouTube API error');
        const data = await response.json();
        setResults(data.items || []);
      } else {
        // No API key — show placeholder results with direct YouTube search links
        // Generate topic-based suggestions from key concepts
        const suggestions = (keyConcepts || []).slice(0, 6).map((kc, i) => ({
          id: { videoId: `search_${i}` },
          snippet: {
            title: kc.term || kc.name || `Topic ${i + 1}`,
            description: kc.definition || '',
            channelTitle: 'YouTube',
            thumbnails: { medium: { url: '' } },
          },
          _searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent((kc.term || kc.name || q) + ' tutorial')}`,
        }));

        if (suggestions.length === 0) {
          // Generic suggestion
          suggestions.push({
            id: { videoId: 'search_generic' },
            snippet: {
              title: q,
              description: `Search YouTube for "${q}" tutorials`,
              channelTitle: 'YouTube',
              thumbnails: { medium: { url: '' } },
            },
            _searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' tutorial')}`,
          });
        }

        setResults(suggestions);
      }
    } catch (err) {
      console.error('YouTube search failed:', err);
      // Fallback to search URL
      setResults([{
        id: { videoId: 'fallback' },
        snippet: {
          title: `Search: ${q}`,
          description: `Click to search YouTube for "${q}" tutorials`,
          channelTitle: 'YouTube',
          thumbnails: { medium: { url: '' } },
        },
        _searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' tutorial')}`,
      }]);
    } finally {
      setLoading(false);
    }
  }, [query, API_KEY, keyConcepts]);

  const handleSuggestFromConcept = useCallback((concept) => {
    const q = concept.term || concept.name || concept;
    setQuery(typeof q === 'string' ? q : String(q));
    handleSearch(typeof q === 'string' ? q : String(q));
  }, [handleSearch]);

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-primary)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Video size={18} color="#FF0000" />
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: '15px',
            fontWeight: 600, color: 'var(--text-primary)',
          }}>
            Educational Videos
          </h3>
        </div>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center',
            gap: '8px', padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search for tutorials..."
              style={{
                flex: 1, background: 'none', border: 'none',
                color: 'var(--text-primary)', fontSize: '13px',
                outline: 'none',
              }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); setHasSearched(false); }}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={!query.trim() || loading}
            style={{
              padding: '10px 18px', borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-accent)', border: 'none',
              color: '#fff', fontSize: '13px', fontWeight: 600,
              cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !query.trim() ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {loading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
            Search
          </button>
        </div>

        {/* Quick suggestions from key concepts */}
        {keyConcepts && keyConcepts.length > 0 && !hasSearched && (
          <div style={{
            display: 'flex', gap: '6px', marginTop: '10px',
            overflowX: 'auto', paddingBottom: '4px',
          }}>
            <span style={{
              fontSize: '10px', color: 'var(--text-muted)',
              alignSelf: 'center', whiteSpace: 'nowrap',
              fontFamily: 'var(--font-mono)',
            }}>
              Quick:
            </span>
            {keyConcepts.slice(0, 5).map((kc, i) => (
              <button
                key={i}
                onClick={() => handleSuggestFromConcept(kc)}
                style={{
                  padding: '4px 10px', borderRadius: 'var(--radius-full)',
                  background: 'rgba(108, 99, 255, 0.08)',
                  border: '1px solid rgba(108, 99, 255, 0.15)',
                  color: 'var(--accent-light)', fontSize: '11px',
                  fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {kc.term || kc.name || `Topic ${i + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {selectedVideo ? (
          /* Video Player */
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <button
              onClick={() => setSelectedVideo(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                marginBottom: '12px', padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              ← Back to results
            </button>

            <div style={{
              position: 'relative', paddingBottom: '56.25%',
              borderRadius: 'var(--radius-md)', overflow: 'hidden',
              background: '#000',
            }}>
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.id?.videoId}?autoplay=1`}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  border: 'none',
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div style={{ marginTop: '12px' }}>
              <h4 style={{
                fontFamily: 'var(--font-display)', fontSize: '15px',
                fontWeight: 600, color: 'var(--text-primary)',
                lineHeight: 1.4, marginBottom: '6px',
              }}>
                {selectedVideo.snippet?.title}
              </h4>
              <p style={{
                fontSize: '12px', color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}>
                {selectedVideo.snippet?.channelTitle}
              </p>
              <p style={{
                fontSize: '13px', color: 'var(--text-secondary)',
                lineHeight: 1.6, marginTop: '8px',
              }}>
                {selectedVideo.snippet?.description}
              </p>
            </div>
          </div>
        ) : loading ? (
          /* Loading */
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '200px', gap: '12px',
          }}>
            <Loader size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Searching videos...</p>
          </div>
        ) : results.length > 0 ? (
          /* Video Grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px',
          }}>
            {results.map((video, i) => (
              <VideoCard
                key={video.id?.videoId || i}
                video={video}
                onClick={() => {
                  if (video._searchUrl) {
                    window.open(video._searchUrl, '_blank');
                  } else {
                    setSelectedVideo(video);
                  }
                }}
              />
            ))}
          </div>
        ) : hasSearched ? (
          /* No results */
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '200px', gap: '8px', color: 'var(--text-muted)',
          }}>
            <Video size={32} />
            <p style={{ fontSize: '13px' }}>No videos found. Try a different search.</p>
          </div>
        ) : (
          /* Empty state */
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '200px', gap: '12px', color: 'var(--text-muted)',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(255, 0, 0, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Video size={24} color="#FF0000" />
            </div>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Search for educational videos
            </p>
            <p style={{ fontSize: '12px', textAlign: 'center', maxWidth: '280px' }}>
              Find tutorials and lectures related to your document topics
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function VideoCard({ video, onClick }) {
  const snippet = video.snippet || {};
  const thumbnail = snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url;
  const isExternal = !!video._searchUrl;

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'var(--transition-fast)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(108, 99, 255, 0.3)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* Thumbnail */}
      <div style={{
        position: 'relative', paddingBottom: '56.25%',
        background: thumbnail ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
      }}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={snippet.title}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Play size={32} color="#fff" />
          </div>
        )}

        {/* Play overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity 0.2s',
        }}
          className="video-card-overlay"
        >
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',              background: 'var(--error)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Play size={18} color="#fff" style={{ marginLeft: '2px' }} />
          </div>
        </div>

        {isExternal && (
          <div style={{
            position: 'absolute', top: '6px', right: '6px',
            padding: '3px 8px', borderRadius: '4px',
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <ExternalLink size={10} color="#fff" />
            <span style={{ fontSize: '9px', color: '#fff', fontWeight: 600 }}>YouTube</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <h4 style={{
          fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)',
          lineHeight: 1.4, marginBottom: '4px',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {snippet.title}
        </h4>
        <p style={{
          fontSize: '10px', color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          {snippet.channelTitle}
        </p>
      </div>
    </div>
  );
}
