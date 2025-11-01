import { useEffect, useRef, useState } from "react";

interface CanvasProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  src?: ArrayBuffer;
}

type DrawOffset = {
  x: number;
  y: number;
};

const STROKE_STYLE = "black";
const STROKE_WIDTH = 2;

function renderImage(
  ref: React.RefObject<HTMLCanvasElement | null>,
  ctx: CanvasRenderingContext2D,
  src: ArrayBuffer
) {
  const blob = new Blob([src]);
  const objectURL = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
    if (ref.current) {
      ref.current.height = img.naturalHeight;
      ref.current.width = img.naturalWidth;
      ctx.clearRect(0, 0, ref.current.width, ref.current.height);
      ctx.drawImage(img, 0, 0);
    }
    URL.revokeObjectURL(objectURL);
  };
  img.src = objectURL;
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  ctx.beginPath();
  ctx.strokeStyle = STROKE_STYLE;
  ctx.lineWidth = STROKE_WIDTH;
  ctx.lineJoin = "round";
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.stroke();
}

function Canvas({ src, ...props }: CanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const isDrawingRef = useRef(false);
  const drawOffsetRef = useRef<DrawOffset>({ x: 0, y: 0 });

  const [ongoingTouches, setOngoingTouches] = useState<Touch[]>([]);
  const getOngoingTouchById = (id: number) =>
    ongoingTouches.findIndex((t) => t.identifier === id);

  useEffect(() => {
    if (!ref.current) return;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    if (!ctx || !src) return;

    ctxRef.current = ctx;
    renderImage(ref, ctx, src);

    const handleMouseDown = (e: MouseEvent) => {
      isDrawingRef.current = true;
      drawOffsetRef.current = { x: e.offsetX, y: e.offsetY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawingRef.current || !ctxRef.current) return;
      const prev = drawOffsetRef.current;
      drawLine(ctxRef.current, prev.x, prev.y, e.offsetX, e.offsetY);
      drawOffsetRef.current = { x: e.offsetX, y: e.offsetY };
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDrawingRef.current || !ctxRef.current) return;
      const prev = drawOffsetRef.current;
      drawLine(ctxRef.current, prev.x, prev.y, e.offsetX, e.offsetY);
      isDrawingRef.current = false;
      drawOffsetRef.current = { x: 0, y: 0 };
    };

    // touch handlers
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        setOngoingTouches((prev) => [...prev, touches[i]]);
      }
      drawOffsetRef.current = { x: rect.left, y: rect.top };
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!ctxRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        const idx = getOngoingTouchById(touches[i].identifier);
        if (idx >= 0) {
          const prev = ongoingTouches[idx];
          drawLine(
            ctxRef.current,
            prev.clientX - rect.left,
            prev.clientY - rect.top,
            touches[i].clientX - rect.left,
            touches[i].clientY - rect.top
          );
          setOngoingTouches((prev) => {
            const updated = [...prev];
            updated.splice(idx, 1, touches[i]);
            return updated;
          });
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        const idx = getOngoingTouchById(touches[i].identifier);
        if (idx >= 0) {
          setOngoingTouches((prev) => prev.filter((_, j) => j !== idx));
        }
      }
    };

    const handleTouchCancel = (e: TouchEvent) => {
      e.preventDefault();
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        const idx = getOngoingTouchById(touches[i].identifier);
        if (idx >= 0) {
          setOngoingTouches((prev) => prev.filter((_, j) => j !== idx));
        }
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchmove", handleTouchMove);
    canvas.addEventListener("touchend", handleTouchEnd);
    canvas.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [src]);

  return <canvas ref={ref} {...props}></canvas>;
}

export default Canvas;
