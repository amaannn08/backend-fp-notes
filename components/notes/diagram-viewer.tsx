"use client";

import { Minus, Plus, Maximize, X } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function DiagramViewer({
  open,
  onOpenChange,
  svg,
  label,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  svg: string;
  label: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-0 left-0 flex h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-background p-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">{label}</DialogTitle>

        <TransformWrapper
          key={svg}
          minScale={0.5}
          maxScale={6}
          initialScale={1}
          centerOnInit
          limitToBounds={false}
          doubleClick={{ mode: "toggle", step: 1.5 }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border p-3">
                <p className="truncate text-sm text-muted-foreground">
                  <span className="pointer-coarse:hidden">Scroll to zoom · drag to pan</span>
                  <span className="hidden pointer-coarse:inline">Pinch to zoom · drag to pan · double-tap to reset</span>
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="outline" size="icon-sm" aria-label="Zoom out" onClick={() => zoomOut()}>
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="icon-sm" aria-label="Reset zoom" onClick={() => resetTransform()}>
                    <Maximize className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="icon-sm" aria-label="Zoom in" onClick={() => zoomIn()}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" aria-label="Close" onClick={() => onOpenChange(false)} className="ml-1">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 touch-none overflow-hidden" style={{ touchAction: "none" }}>
                <TransformComponent
                  wrapperClass="!w-full !h-full"
                  contentClass="!w-full !h-full flex items-center justify-center"
                >
                  <div
                    className="mermaid-container w-full [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-none"
                    role="img"
                    aria-label={label}
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                </TransformComponent>
              </div>
            </>
          )}
        </TransformWrapper>
      </DialogContent>
    </Dialog>
  );
}
