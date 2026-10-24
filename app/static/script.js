
document.querySelectorAll('form').forEach((form) => {
    const input = form.querySelector('.file-input');
    const zone = form.querySelector('[data-dropzone]');
    const preview = form.querySelector('.file-preview');
    const previewContent = form.querySelector('.preview-content');
    const hashBox = form.querySelector('.hash-box');
    const hashValue = form.querySelector('.hash-value');
    const hashStatus = form.querySelector('.hash-status');
    const removeButton = form.querySelector('.remove-file');
    const copyButton = form.querySelector('.copy-hash');

    if (!input || !zone) return;

    let currentHash = '';
    let objectUrl = null;
    let hashRequest = 0;

    function formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    function cleanupPreview() {
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
        }
    }

    function resetPreview() {
        hashRequest++;
        currentHash = '';
        cleanupPreview();
        preview.hidden = true;
        hashBox.hidden = true;
        previewContent.replaceChildren();
        hashValue.textContent = '';
        hashStatus.textContent = 'GENERATING';
    }

    function makeElement(tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined) el.textContent = text;
        return el;
    }

    async function showFile(file) {
        resetPreview();
        if (!file) return;

        const allowed = /\.(pdf|png|jpe?g|webp|docx?)$/i.test(file.name);
        if (!allowed) {
            input.value = '';
            alert('Please select a PDF, image, DOC, or DOCX file.');
            return;
        }

        if (file.size > 15 * 1024 * 1024) {
            input.value = '';
            alert('Please select a file smaller than 15 MB.');
            return;
        }

        const requestId = hashRequest;

        const details = makeElement('div', 'file-details');
        details.append(
            makeElement('strong', '', file.name),
            makeElement('small', '', formatSize(file.size))
        );

        const ext = (file.name.split('.').pop() || 'FILE').toUpperCase();
        const icon = makeElement('div', 'file-type-icon', ext.slice(0, 4));

        previewContent.append(icon, details);

        if (file.type.startsWith('image/')) {
            objectUrl = URL.createObjectURL(file);
            const img = makeElement('img');
            img.src = objectUrl;
            img.alt = 'Selected document preview';
            previewContent.prepend(img);
        } else if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
            objectUrl = URL.createObjectURL(file);
            const link = makeElement('a', '', 'Open PDF preview');
            link.href = objectUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.style.fontSize = '10px';
            details.append(link);
        }

        preview.hidden = false;
        hashBox.hidden = false;
        hashStatus.textContent = 'GENERATING';
        hashValue.textContent = 'Calculating fingerprint…';

        try {
            if (!window.crypto || !crypto.subtle) {
                throw new Error('SHA-256 preview is unavailable in this browser context.');
            }

            const bytes = await file.arrayBuffer();
            const digest = await crypto.subtle.digest('SHA-256', bytes);
            const result = Array.from(new Uint8Array(digest))
                .map(byte => byte.toString(16).padStart(2, '0'))
                .join('');

            if (requestId !== hashRequest) return;

            currentHash = result;
            hashValue.textContent = result;
            hashStatus.textContent = 'READY';
        } catch (error) {
            if (requestId !== hashRequest) return;
            hashValue.textContent = error.message || 'Unable to calculate fingerprint.';
            hashStatus.textContent = 'UNAVAILABLE';
        }
    }

    input.addEventListener('change', () => showFile(input.files[0]));

    zone.addEventListener('dragover', (event) => {
        event.preventDefault();
        zone.classList.add('dragging');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('dragging');
    });

    zone.addEventListener('drop', (event) => {
        event.preventDefault();
        zone.classList.remove('dragging');

        const file = event.dataTransfer.files[0];
        if (!file) return;

        const transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;
        showFile(file);
    });

    removeButton.addEventListener('click', () => {
        input.value = '';
        resetPreview();
    });

    copyButton.addEventListener('click', async () => {
        if (!currentHash) return;

        try {
            await navigator.clipboard.writeText(currentHash);
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
                copyButton.textContent = 'Copy fingerprint';
            }, 1500);
        } catch {
            alert('Clipboard access failed. Select and copy the fingerprint manually.');
        }
    });

    form.addEventListener('submit', (event) => {
        if (!input.files.length) {
            event.preventDefault();
            alert('Please select a document first.');
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Processing…';
        }
    });
});
