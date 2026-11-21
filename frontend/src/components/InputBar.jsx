import React, { useState, useRef } from 'react';
import {
  Plus,
  Mic,
  MicOff,
  Send,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  X,
  Loader2
} from 'lucide-react';

export default function InputBar({
  onSendMessage,
  onUploadFile,
  disabled
}) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  const attachTypeRef = useRef('document');
  const recognitionRef = useRef(null);

  const handleOpenFileInput = (type) => {
    attachTypeRef.current = type;
    if (fileInputRef.current) {
      if (type === 'image') fileInputRef.current.accept = 'image/*';
      else if (type === 'audio') fileInputRef.current.accept = 'audio/*';
      else if (type === 'video') fileInputRef.current.accept = 'video/*';
      else fileInputRef.current.accept = '.pdf,.docx,.txt,.csv,.md,.json,.py,.js';

      fileInputRef.current.click();
    }
    setShowAttachMenu(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await onUploadFile(file, attachTypeRef.current);
      setAttachments(prev => [...prev, res]);
    } catch (err) {
      alert("Failed to upload: " + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleMic = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setText(prev => (prev ? prev + ' ' : '') + transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      setIsRecording(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if ((!text.trim() && attachments.length === 0) || disabled || isUploading) return;

    onSendMessage(text.trim(), attachments);
    setText('');
    setAttachments([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '780px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 25
    }}>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '10px',
          padding: '4px 12px'
        }}>
          {attachments.map((att, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5D5CA',
              borderRadius: '999px',
              padding: '4px 12px',
              fontSize: '12.5px',
              color: '#2A2522',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              {att.file_type === 'image' && <ImageIcon size={14} color="#C2693F" />}
              {att.file_type === 'audio' && <Music size={14} color="#C2693F" />}
              {att.file_type === 'video' && <Video size={14} color="#C2693F" />}
              {att.file_type === 'document' && <FileText size={14} color="#C2693F" />}
              <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {att.file_name}
              </span>
              <button
                onClick={() => handleRemoveAttachment(idx)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', display: 'flex', color: '#8A7D74' }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Pill Input Bar */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#FFFDF9',
          borderRadius: '999px',
          padding: '7px 8px 7px 12px',
          boxShadow: '0 10px 32px rgba(42, 37, 34, 0.08), 0 1px 3px rgba(42, 37, 34, 0.04)',
          border: '1px solid rgba(194, 105, 63, 0.16)',
          position: 'relative'
        }}
      >
        {/* Left Attachment Button (+) */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#F5ECE5',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2A2522',
              transition: 'all 0.18s ease'
            }}
            title="Attach media or document"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFE1D8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5ECE5'}
          >
            {isUploading ? (
              <Loader2 size={18} className="animate-spin" color="#C2693F" />
            ) : (
              <Plus size={20} strokeWidth={2.2} />
            )}
          </button>

          {/* Attachment Popup Menu */}
          {showAttachMenu && (
            <div style={{
              position: 'absolute',
              bottom: '50px',
              left: 0,
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 12px 32px rgba(42, 37, 34, 0.16)',
              border: '1px solid #EFE3DA',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: '180px',
              zIndex: 100,
              animation: 'fadeIn 0.2s ease'
            }}>
              <button
                type="button"
                onClick={() => handleOpenFileInput('image')}
                style={attachMenuItemStyle}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF0EA'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <ImageIcon size={17} color="#C2693F" />
                <span>Upload Image</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenFileInput('audio')}
                style={attachMenuItemStyle}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF0EA'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Music size={17} color="#C2693F" />
                <span>Upload Audio</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenFileInput('video')}
                style={attachMenuItemStyle}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF0EA'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Video size={17} color="#C2693F" />
                <span>Upload Video</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenFileInput('document')}
                style={attachMenuItemStyle}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF0EA'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FileText size={17} color="#C2693F" />
                <span>Upload Document</span>
              </button>
            </div>
          )}
        </div>

        {/* Text Input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          disabled={disabled}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            padding: '10px 18px',
            fontSize: '15px',
            color: '#2A2522'
          }}
        />

        {/* Right Section: Mic, Divider, Terracotta Send Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Microphone Button */}
          <button
            type="button"
            onClick={toggleMic}
            style={{
              background: isRecording ? '#FDF0E9' : 'none',
              border: isRecording ? '1px solid #C2693F' : 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isRecording ? '#C2693F' : '#6A5F57',
              transition: 'all 0.2s ease'
            }}
            title={isRecording ? "Listening... click to stop" : "Voice input"}
          >
            {isRecording ? <MicOff size={19} color="#C2693F" /> : <Mic size={20} />}
          </button>

          {/* Thin Vertical Divider */}
          <div style={{ width: '1px', height: '26px', backgroundColor: 'rgba(42, 37, 34, 0.12)' }} />

          {/* Terracotta Send Button */}
          <button
            type="submit"
            disabled={disabled || (!text.trim() && attachments.length === 0)}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#C2693F',
              color: '#FFFFFF',
              border: 'none',
              cursor: (!text.trim() && attachments.length === 0) ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(194, 105, 63, 0.35)',
              transition: 'transform 0.15s ease, background-color 0.2s ease',
              opacity: (!text.trim() && attachments.length === 0) ? 0.8 : 1
            }}
            title="Send message"
            onMouseEnter={(e) => {
              if (text.trim() || attachments.length > 0) {
                e.currentTarget.style.backgroundColor = '#AF5B33';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#C2693F';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Send size={18} style={{ transform: 'translateX(-1px) translateY(1px)' }} />
          </button>
        </div>
      </form>
    </div>
  );
}

const attachMenuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 14px',
  borderRadius: '10px',
  border: 'none',
  background: 'none',
  fontSize: '13px',
  fontWeight: '500',
  color: '#2A2522',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  transition: 'background-color 0.15s ease'
};
