import React from 'react';

export default function AdminPanelStyles() {
  return (
    <style>{`
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .admin-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        transition: all 0.2s ease;
        animation: slideUp 0.3s ease-out;
      }
      
      .admin-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        border-color: #3b82f6;
      }
      
      .admin-button {
        background: white;
        border: 1px solid #e5e7eb;
        transition: all 0.2s ease;
      }
      
      .admin-button:hover {
        background: #f9fafb;
        border-color: #3b82f6;
        color: #3b82f6;
      }
      
      .admin-button-primary {
        background: #3b82f6;
        color: white;
        border: 1px solid #3b82f6;
        transition: all 0.2s ease;
      }
      
      .admin-button-primary:hover {
        background: #2563eb;
        border-color: #2563eb;
      }
    `}</style>
  );
}