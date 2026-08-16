import { useRef, useState, useCallback } from 'react';
import { Upload, FileText, X, Sparkles, Loader, Book, FileCode2 } from 'lucide-react';
import { getFileAcceptString } from '../lib/fileExtractor';

const ALLOWED_EXTENSIONS = ['pdf', 'epub', 'docx'];

export default function PDFUpload({ onFileSelect, file, onClear, onGenerate, loading }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  /** Check if file has an allowed extension */
  function isAllowedFile(file) {
    const name = file.name.toLowerCase();
    return ALLOWED_EXTENSIONS.some(ext => name.endsWith('.' + ext));
  }

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'application/pdf' || isAllowedFile(droppedFile))) {
      onFileSelect(droppedFile);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  }, [onFileSelect]);

  /** File-type-specific icon */
  function FileTypeIcon({ name, size = 20 }) {
    const lower = name.toLowerCase();
    if (lower.endsWith('.epub')) return <Book size={size} />;
    if (lower.endsWith('.docx')) return <FileCode2 size={size} />;
    return <FileText size={size} />;
  }

  if (file) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)',
        padding: '40px 20px',
        animation: 'fadeIn 0.5s ease-out',
      }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '480px',
          width: '100%',
          position: 'relative',
        }}>
          <button
            onClick={onClear}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--error)',
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(248, 113, 113, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'}
          >
            <X size={16} />
          </button>
          
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(108, 99, 255, 0.1)',
            border: '1px solid rgba(108, 99, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <FileTypeIcon name={file.name} size={32} />
          </div>
          
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '8px',
          }}>
            {file.name}
          </h3>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            marginBottom: '4px',
          }}>
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </p>
          <p style={{
            fontSize: '13px',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '20px',
          }}>
            ✓ Ready to generate
          </p>

          {/* Generate Button */}
          <button
            onClick={onGenerate}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '14px 24px',
              borderRadius: 'var(--radius-md)',
              background: loading ? 'rgba(108, 99, 255, 0.2)' : 'var(--gradient-accent)',
              backgroundSize: '200% 200%',
              color: loading ? 'var(--text-muted)' : '#fff',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'var(--transition-base)',
              boxShadow: loading ? 'none' : 'var(--shadow-glow)',
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 30px var(--accent-glow-strong), 0 8px 24px rgba(0,0,0,0.3)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = loading ? 'none' : 'var(--shadow-glow)';
            }}
          >
            {loading ? (
              <>
                <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Analyzing PDF...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Summary & Mind Map
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 64px)',
      padding: '40px 20px',
    }}>
      {/* Hero text */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        animation: 'fadeIn 0.6s ease-out',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: 700,
          marginBottom: '12px',
          lineHeight: 1.2,
        }}>
          Transform Documents with{' '}
          <span className="gradient-text">AI Intelligence</span>
        </h2>
        <p style={{
          fontSize: '16px',
          color: 'var(--text-secondary)',
          maxWidth: '520px',
          margin: '0 auto',
        }}>
          Upload any PDF, EPUB, or DOCX and get AI-powered summaries with interactive mind maps
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          width: '100%',
          maxWidth: '520px',
          minHeight: '240px',
          borderRadius: 'var(--radius-xl)',
          border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border-color)'}`,
          background: dragging
            ? 'rgba(108, 99, 255, 0.08)'
            : 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          cursor: 'pointer',
          transition: 'var(--transition-base)',
          animation: 'fadeIn 0.8s ease-out',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={e => {
          if (!dragging) {
            e.currentTarget.style.borderColor = 'var(--border-hover)';
            e.currentTarget.style.background = 'var(--bg-card)';
          }
        }}
        onMouseLeave={e => {
          if (!dragging) {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.background = 'var(--bg-secondary)';
          }
        }}
      >
        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
          filter: 'blur(40px)',
          opacity: dragging ? 0.6 : 0.2,
          transition: 'opacity 0.3s',
          pointerEvents: 'none',
        }} />

        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: dragging ? 'rgba(108, 99, 255, 0.2)' : 'rgba(108, 99, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'var(--transition-base)',
          position: 'relative',
          zIndex: 1,
        }}>
          <Upload
            size={28}
            color="var(--accent)"
            style={{
              transform: dragging ? 'translateY(-4px)' : 'none',
              transition: 'transform 0.3s',
            }}
          />
        </div>

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p style={{
            fontSize: '15px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            marginBottom: '4px',
          }}>
            {dragging ? 'Drop your document here' : 'Drag & drop your document here'}
          </p>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}>
            or <span style={{ color: 'var(--accent-light)', fontWeight: 500 }}>browse files</span> • PDF, EPUB, or DOCX (up to 50MB)
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={getFileAcceptString()}
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}
