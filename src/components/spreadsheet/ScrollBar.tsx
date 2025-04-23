import React from 'react';

interface ScrollBarProps {
    type: 'horizontal' | 'vertical';
    viewportSize: number;
    contentSize: number;
    scrollPosition: number;
    onDragStart: (e: React.MouseEvent, type: 'horizontal' | 'vertical') => void;
}

export const ScrollBar: React.FC<ScrollBarProps> = ({
    type,
    viewportSize,
    contentSize,
    scrollPosition,
    onDragStart
}) => {
    const isHorizontal = type === 'horizontal';
    const scrollBarSize = (viewportSize / contentSize) * 100;
    const scrollBarPosition = (scrollPosition / contentSize) * 100;
    return (
        <div
            style={{
                position: 'absolute',
                ...(isHorizontal
                    ? {
                        left: 0,
                        bottom: 0,
                        width: 'calc(100% - 10px)',
                        height: '8px',
                    }
                    : {
                        right: 0,
                        top: 0,
                        width: '8px',
                        height: '100%',
                    }),
                backgroundColor: '#f0f0f0',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    ...(isHorizontal
                        ? {
                            height: '100%',
                            width: `${scrollBarSize}%`,
                            left: `${scrollBarPosition}%`,
                        }
                        : {
                            width: '100%',
                            height: `${scrollBarSize}%`,
                            top: `${scrollBarPosition}%`,
                        }),
                    backgroundColor: '#c1c1c1',
                    borderRadius: '4px',
                    cursor: 'pointer',
                }}
                onMouseDown={(e) => onDragStart(e, type)}
            />
        </div>
    );
};