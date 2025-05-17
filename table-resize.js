// Table column resize functionality
function initializeTableResize() {
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
        const headers = table.querySelectorAll('th');
        
        headers.forEach((header, index) => {
            // Skip the last header as it doesn't need a resizer
            if (index < headers.length - 1) {
                const resizer = document.createElement('div');
                resizer.classList.add('resizer');
                header.appendChild(resizer);
                
                let startX, startWidth;
                
                const startResize = (e) => {
                    startX = e.pageX;
                    startWidth = header.offsetWidth;
                    document.addEventListener('mousemove', resize);
                    document.addEventListener('mouseup', stopResize);
                    document.body.style.cursor = 'col-resize';
                };
                
                const resize = (e) => {
                    const width = startWidth + (e.pageX - startX);
                    if (width > 50) { // Minimum width of 50px
                        header.style.width = `${width}px`;
                    }
                };
                
                const stopResize = () => {
                    document.removeEventListener('mousemove', resize);
                    document.removeEventListener('mouseup', stopResize);
                    document.body.style.cursor = '';
                };
                
                resizer.addEventListener('mousedown', startResize);
            }
        });
    });
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTableResize);

// Export for use in other files if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeTableResize };
} 