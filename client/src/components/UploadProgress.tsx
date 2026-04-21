/**
 * UploadProgress — file upload indicator (§23.73).
 */
import { signal } from '@preact/signals'

export const uploadProgress = signal<{ filename: string; percent: number } | null>(null)

export async function uploadWithProgress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('file', file)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        uploadProgress.value = { filename: file.name, percent: Math.round((e.loaded / e.total) * 100) }
      }
    }
    xhr.onload = () => {
      uploadProgress.value = null
      if (xhr.status < 300) {
        const data = JSON.parse(xhr.responseText)
        resolve(data.url || data.filename)
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    }
    xhr.onerror = () => { uploadProgress.value = null; reject(new Error('Upload failed')) }
    xhr.open('POST', '/api/media/upload')
    const token = localStorage.getItem('sh_token')
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  })
}

export function UploadProgressBar() {
  const p = uploadProgress.value
  if (!p) return null
  return (
    <div class="sh-upload-progress" role="progressbar" aria-valuenow={p.percent} aria-valuemin={0} aria-valuemax={100}>
      <span class="sh-upload-filename">{p.filename}</span>
      <div class="sh-upload-bar"><div class="sh-upload-fill" style={{ width: `${p.percent}%` }} /></div>
      <span class="sh-upload-pct">{p.percent}%</span>
    </div>
  )
}
