sed -i "s/enabled={theme !== 'ocean' && theme !== 'train'}/enabled={theme !== 'train'}/g" components/MemoryCanvas.tsx
sed -i "s/enablePan={theme !== 'train' && theme !== 'ocean'}/enablePan={theme !== 'train'}/g" components/MemoryCanvas.tsx
sed -i "s/autoRotate={theme !== 'train' && theme !== 'ocean'}/autoRotate={theme !== 'train'}/g" components/MemoryCanvas.tsx
