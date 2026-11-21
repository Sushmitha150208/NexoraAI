import React, { useState } from 'react';
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  RotateCcw,
  Download,
  Play,
  FileText
} from 'lucide-react';
import { sendFeedback } from '../api';

export default function ChatMessage({ message, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(message.feedback || 0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (val) => {
    const newVal = feedback === val ? 0 : val;
    setFeedback(newVal);
    try {
      await sendFeedback(message.id, newVal);
    } catch {}
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(message.content.replace(/[#*`_]/g, ''));
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  const renderFormattedContent = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeBuffer = [];
    let codeLang = '';
    const elements = [];

    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLang = line.replace('```', '').trim() || 'code';
          codeBuffer = [];
        } else {
          inCodeBlock = false;
          const codeString = codeBuffer.join('\n');
          elements.push(
            <div key={`code-${index}`} style={{
              backgroundColor: '#1E1A18',
              borderRadius: '12px',
              margin: '12px 0',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 14px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                fontSize: '12px',
                color: '#A89B92'
              }}>
                <span>{codeLang}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(codeString)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#C7BBB2',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Copy size={12} />
                  <span>Copy</span>
                </button>
              </div>
              <pre style={{
                padding: '14px',
                margin: 0,
                color: '#EFEAE6',
                fontFamily: 'monospace',
                fontSize: '13px',
                overflowX: 'auto',
                lineHeight: 1.5
              }}>
                <code>{codeString}</code>
              </pre>
            </div>
          );
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} style={{
            fontSize: '17px',
            fontWeight: '600',
            color: '#2A2522',
            margin: '14px 0 6px 0',
            fontFamily: 'var(--font-sans)'
          }}>
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={index} style={{
            fontSize: '15px',
            fontWeight: '600',
            color: '#C2693F',
            margin: '12px 0 4px 0'
          }}>
            {line.replace('#### ', '')}
          </h4>
        );
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={index} style={{
            borderLeft: '3px solid #C2693F',
            paddingLeft: '12px',
            margin: '10px 0',
            color: '#6E6259',
            fontStyle: 'italic',
            fontSize: '13.5px'
          }}>
            {line.replace('> ', '')}
          </blockquote>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={index} style={{ marginLeft: '20px', marginBottom: '4px', lineHeight: 1.5 }}>
            {parseInline(line.substring(2))}
          </li>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={index} style={{ height: '8px' }} />);
      } else {
        elements.push(
          <p key={index} style={{ margin: '4px 0', lineHeight: 1.55 }}>
            {parseInline(line)}
          </p>
        );
      }
    });

    return elements;
  };

  const parseInline = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: isUser ? '#FFFFFF' : '#1F1B18' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const fullMediaUrl = message.media_url?.startsWith('/')
    ? `http://127.0.0.1:8000${message.media_url}`
    : message.media_url;

  const rawAttachments = message.attachments_data && message.attachments_data.length > 0
    ? message.attachments_data
    : (message.media_url ? [{ file_url: message.media_url, file_type: message.modality, file_name: 'Attachment' }] : []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '22px',
      width: '100%',
      maxWidth: '780px',
      margin: '0 auto 20px auto'
    }}>
      {/* Sender indicator for Assistant */}
      {!isUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', paddingLeft: '4px' }}>
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#C2693F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            N
          </div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#2A2522' }}>NexoraAI</span>
        </div>
      )}

      {/* Message Bubble Card */}
      <div style={{
        maxWidth: isUser ? '80%' : '100%',
        backgroundColor: isUser ? '#C2693F' : '#FFFFFF',
        color: isUser ? '#FFFFFF' : '#2A2522',
        borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
        padding: '16px 20px',
        boxShadow: isUser ? '0 4px 16px rgba(194, 105, 63, 0.2)' : '0 4px 20px rgba(42, 37, 34, 0.06)',
        border: isUser ? 'none' : '1px solid #EFE3DA',
        fontSize: '14.5px',
        wordBreak: 'break-word',
        position: 'relative'
      }}>
        {/* User Attached Image / Media rendering */}
        {isUser && rawAttachments.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            {rawAttachments.map((att, idx) => {
              const url = att.file_url || message.media_url;
              const fullUrl = url?.startsWith('/') ? `http://127.0.0.1:8000${url}` : url;
              const isImg = att.file_type === 'image' || fullUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
              return (
                <div key={idx} style={{ marginBottom: '6px' }}>
                  {isImg ? (
                    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.4)', maxWidth: '280px' }}>
                      <img
                        src={fullUrl}
                        alt={att.file_name || "Attached visual"}
                        style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#FFFFFF'
                    }}>
                      <FileText size={14} />
                      <span>{att.file_name || "Attached file"}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Assistant Multimodal Generated Images */}
        {!isUser && message.modality === 'image' && fullMediaUrl && (
          <div style={{ marginBottom: '14px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #E5D5CA' }}>
            <img
              src={fullMediaUrl}
              alt="Generated visual"
              style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              backgroundColor: '#FAF0EA',
              fontSize: '12px'
            }}>
              <span style={{ color: '#C2693F', fontWeight: '600' }}>AI-Generated Image</span>
              <a
                href={fullMediaUrl}
                download="nexora_generated_image.svg"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#2A2522',
                  textDecoration: 'none',
                  fontWeight: '500',
                  backgroundColor: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #E5D5CA'
                }}
              >
                <Download size={13} />
                <span>Download</span>
              </a>
            </div>
          </div>
        )}

        {/* Assistant Multimodal Generated Videos */}
        {!isUser && message.modality === 'video' && fullMediaUrl && (
          <div style={{ marginBottom: '14px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #E5D5CA' }}>
            <div style={{
              width: '100%',
              height: '240px',
              backgroundColor: '#1E1A18',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              gap: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#C2693F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Play size={24} color="#FFFFFF" style={{ marginLeft: '3px' }} />
              </div>
              <div style={{ fontSize: '13px', color: '#D4C8C0' }}>AI Generated Video Stream</div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              backgroundColor: '#FAF0EA',
              fontSize: '12px'
            }}>
              <span style={{ color: '#C2693F', fontWeight: '600' }}>AI-Generated Video</span>
              <a
                href={fullMediaUrl}
                download="nexora_generated_video.mp4"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#2A2522',
                  textDecoration: 'none',
                  fontWeight: '500',
                  backgroundColor: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #E5D5CA'
                }}
              >
                <Download size={13} />
                <span>Download</span>
              </a>
            </div>
          </div>
        )}

        {/* Assistant Multimodal Generated Audio */}
        {!isUser && message.modality === 'audio' && fullMediaUrl && (
          <div style={{
            margin: '10px 0 14px 0',
            backgroundColor: '#FAF0EA',
            padding: '12px 16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            border: '1px solid #E5D5CA'
          }}>
            <audio controls src={fullMediaUrl} style={{ height: '36px' }} />
            <a
              href={fullMediaUrl}
              download="nexora_audio.wav"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#2A2522',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: '#FFFFFF',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #E5D5CA'
              }}
            >
              <Download size={13} />
              <span>Download</span>
            </a>
          </div>
        )}

        {/* Formatted Text Content */}
        <div>{renderFormattedContent(message.content)}</div>

        {/* Grounded RAG Sources Badge */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div style={{
            marginTop: '12px',
            paddingTop: '8px',
            borderTop: '1px solid #F2E6DD',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11.5px',
            color: '#8D7F76'
          }}>
            <span style={{ fontWeight: '600' }}>Sources:</span>
            {message.sources.map((s, idx) => (
              <span key={idx} style={{
                backgroundColor: '#FAF0EA',
                color: '#C2693F',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid #ECD9CD'
              }}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Assistant Action Toolbar */}
      {!isUser && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginTop: '6px',
          paddingLeft: '6px',
          color: '#8D7F76',
          fontSize: '12.5px'
        }}>
          <button onClick={handleCopy} style={actionBtnStyle} title="Copy message">
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleSpeak}
            style={{ ...actionBtnStyle, color: isPlayingAudio ? '#C2693F' : '#8D7F76' }}
            title="Listen to response"
          >
            <Volume2 size={14} />
            <span>{isPlayingAudio ? 'Stop' : 'Listen'}</span>
          </button>

          {onRegenerate && (
            <button onClick={onRegenerate} style={actionBtnStyle} title="Regenerate response">
              <RotateCcw size={14} />
              <span>Regenerate</span>
            </button>
          )}

          <button
            onClick={() => handleFeedback(1)}
            style={{ ...actionBtnStyle, color: feedback === 1 ? '#C2693F' : '#8D7F76' }}
            title="Good response"
          >
            <ThumbsUp size={14} />
          </button>

          <button
            onClick={() => handleFeedback(-1)}
            style={{ ...actionBtnStyle, color: feedback === -1 ? '#C2693F' : '#8D7F76' }}
            title="Needs improvement"
          >
            <ThumbsDown size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

const actionBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#8D7F76',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 6px',
  borderRadius: '4px',
  fontSize: '12px',
  transition: 'color 0.15s ease'
};
