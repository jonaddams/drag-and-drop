'use client';
import Image from 'next/image';
import Viewer from '@/components/viewer';
import { useState } from 'react';

export default function Home() {
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const [formCreatorMode, setFormCreatorMode] = useState(false);

  // Handle drag start event
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, annotationType: string) => {
    // Only allow drag when Form Creator mode is enabled
    if (!formCreatorMode) {
      event.preventDefault();
      return;
    }

    // Set data transfer with the annotation type
    event.dataTransfer.setData('text', annotationType);
    // Set effects
    event.dataTransfer.effectAllowed = 'copy';
    // Update state to reflect the currently dragging item
    setDraggingItem(annotationType);
  };

  // Handle drag end event
  const handleDragEnd = () => {
    // Reset the dragging state
    setDraggingItem(null);
  };

  // Toggle Form Creator Mode
  const toggleFormCreatorMode = () => {
    setFormCreatorMode(!formCreatorMode);
  };

  return (
    <div className='flex h-screen w-full'>
      {/* Sidebar */}
      <div className='w-64 bg-gray-100 border-r border-gray-200 p-4 overflow-y-auto'>
        <h1 className='text-xl font-bold mb-4'>Annotation Tools</h1>

        {/* Form Creator Mode Toggle */}
        <div className='mb-4 pb-4 border-b border-gray-200'>
          <label className='inline-flex items-center cursor-pointer'>
            <input type='checkbox' className='sr-only peer' checked={formCreatorMode} onChange={toggleFormCreatorMode} />
            <div className="relative w-11 h-6 bg-gray-300 peer-checked:bg-green-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            <span className='ml-3 text-sm font-medium'>Form Creator Mode</span>
          </label>
        </div>

        {/* Status message when Form Creator mode is disabled */}
        {!formCreatorMode && (
          <div className='mb-4 p-2 bg-gray-200 text-gray-700 text-sm rounded'>Enable Form Creator Mode to use drag and drop functionality</div>
        )}

        {/* Annotation Items */}
        <div className='space-y-4'>
          <div
            className={`p-3 bg-white rounded-lg shadow-sm border border-gray-200 ${formCreatorMode ? 'cursor-grab hover:bg-gray-50' : 'cursor-not-allowed opacity-50'} ${draggingItem === 'Signature' ? 'opacity-50' : ''}`}
            draggable={formCreatorMode}
            onDragStart={(e) => handleDragStart(e, 'Signature')}
            onDragEnd={handleDragEnd}
          >
            <div className='flex items-center'>
              <div className='w-8 h-8 flex items-center justify-center mr-3'>
                <Image src='/file.svg' alt='Signature' width={24} height={24} />
              </div>
              <span className='font-medium'>Signature</span>
            </div>
          </div>

          <div
            className={`p-3 bg-white rounded-lg shadow-sm border border-gray-200 ${formCreatorMode ? 'cursor-grab hover:bg-gray-50' : 'cursor-not-allowed opacity-50'} ${draggingItem === 'DateSigned' ? 'opacity-50' : ''}`}
            draggable={formCreatorMode}
            onDragStart={(e) => handleDragStart(e, 'DateSigned')}
            onDragEnd={handleDragEnd}
          >
            <div className='flex items-center'>
              <div className='w-8 h-8 flex items-center justify-center mr-3'>
                <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
              </div>
              <span className='font-medium'>Date Signed</span>
            </div>
          </div>

          <div
            className={`p-3 bg-white rounded-lg shadow-sm border border-gray-200 ${formCreatorMode ? 'cursor-grab hover:bg-gray-50' : 'cursor-not-allowed opacity-50'} ${draggingItem === 'Initials' ? 'opacity-50' : ''}`}
            draggable={formCreatorMode}
            onDragStart={(e) => handleDragStart(e, 'Initials')}
            onDragEnd={handleDragEnd}
          >
            <div className='flex items-center'>
              <div className='w-8 h-8 flex items-center justify-center mr-3'>
                <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                  />
                </svg>
              </div>
              <span className='font-medium'>Initials</span>
            </div>
          </div>
        </div>

        <div className='mt-6 text-sm text-gray-500'>
          <p>Drag and drop items onto the document to add annotations.</p>
        </div>
      </div>

      {/* Viewer */}
      <div className='flex-1'>
        <Viewer formCreatorMode={formCreatorMode} />
      </div>
    </div>
  );
}
