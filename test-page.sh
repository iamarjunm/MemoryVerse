sed -i 's/<MemoryCanvas onMemoryClick={setSelectedMemory}/<MemoryCanvas onMemoryClick={(data) => { if (viewState !== "canvas") setSelectedMemory(data); }}/g' app/page.tsx
