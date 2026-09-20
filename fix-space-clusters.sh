sed -i "s/const typeIndex = \['photo', 'video', 'voice', 'note'\].indexOf(data.type);/const groups = \['Travels 2018', 'Family', 'College Years', 'Travels', 'Friends'\]; const typeIndex = groups.indexOf(data.group);/g" components/MemoryCanvas.tsx
sed -i "s/const clusterCenters = \[/const clusterCenters = \[ { x: 0, y: 0, z: 0 },/g" components/MemoryCanvas.tsx
