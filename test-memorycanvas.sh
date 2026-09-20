sed -i 's/onMemoryClick: (data: any) => void/onMemoryClick: (data: any | null) => void/g' components/MemoryCanvas.tsx
