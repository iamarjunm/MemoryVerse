sed -i "s/enablePan={theme === 'train' ? false : true}/enablePan={theme !== 'train' \&\& theme !== 'ocean'}/g" components/MemoryCanvas.tsx
sed -i "s/autoRotate={theme !== 'train'}/autoRotate={theme !== 'train' \&\& theme !== 'ocean'}/g" components/MemoryCanvas.tsx
sed -i "s/maxDistance={150}/maxDistance={theme === 'ocean' ? Infinity : 150}/g" components/MemoryCanvas.tsx
