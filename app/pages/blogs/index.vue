<script setup lang="ts">
import { ref, watch, computed, onMounted, watchEffect } from 'vue'

definePageMeta({
  middleware: ['auth']
})

const page = ref(1)
const searchQuery = ref('')
const debouncedSearch = ref('')
let debounceTimer: any = null

// Debounce para la búsqueda
watch(searchQuery, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = newVal
    page.value = 1
  }, 500)
})

interface Blog {
  id: number | string
  image: string | null
  status: string
  categoryCode: string
  publishedAt: string | null
  translations: {
    title: string
    content: string
  }[]
  writer: string
}

interface ApiResponse {
  data: Blog[]
  meta: {
    current_page: number
    last_page: number
    total: number
    per_page: number
  }
}

// Fetch de datos reactivo con tipado
const { data: response, pending, refresh, error } = await useAsyncData<ApiResponse>(
  'blogs',
  () => useApi<ApiResponse>('/blogs', {
    query: {
      page: page.value,
      per_page: 9,
      search: debouncedSearch.value
    }
  }),
  {
    watch: [page, debouncedSearch]
  }
)

// Debug logs
watchEffect(() => {
  if (response.value) console.log('Blogs Response:', response.value)
  if (error.value) console.error('Blogs Fetch Error:', error.value)
})

const blogs = computed(() => {
  console.log('Computing blogs from response:', response.value)
  return response.value?.data || []
})
const meta = computed(() => response.value?.meta || null)

const getStatusClass = (status: string) => {
  switch (status) {
    case 'published': return 'status-published'
    case 'draft': return 'status-draft'
    case 'scheduled': return 'status-scheduled'
    default: return 'status-neutral'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'published': return 'Publicado'
    case 'draft': return 'Borrador'
    case 'scheduled': return 'Programado'
    default: return status
  }
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Sin fecha'
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const handleRefresh = () => {
  refresh()
}
</script>

<template>
  <div class="blogs-container">
    <!-- Header -->
    <header class="blogs-header">
      <div class="header-info">
        <h1 class="header-title">Gestión de <span class="gold">Contenido</span></h1>
        <p class="header-desc">Publica y edita los artículos que verán tus pacientes y seguidores.</p>
      </div>
      <div class="header-actions">
        <button class="btn-refresh" :disabled="pending" @click="handleRefresh" title="Actualizar">
          <UIcon name="i-heroicons-arrow-path" :class="{ 'animate-spin': pending }" class="icon-md" />
        </button>
        <NuxtLink to="/blogs/create" class="btn-primary">
          <UIcon name="i-heroicons-plus" class="icon-md" />
          <span>Nueva Entrada</span>
        </NuxtLink>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="blogs-toolbar">
      <div class="search-wrap">
        <UIcon name="i-heroicons-magnifying-glass" class="search-icon" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar artículos por título..." 
          class="search-input"
        />
      </div>
      <div class="filters-wrap">
        <div class="custom-select">
          <select class="select-field">
            <option>Todos los estados</option>
            <option>Publicados</option>
            <option>Borradores</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Grid -->
    <div v-if="pending && !blogs.length" class="blogs-grid">
      <div v-for="i in 6" :key="i" class="skeleton-card"></div>
    </div>

    <div v-else-if="blogs.length" class="blogs-grid">
      <article v-for="blog in blogs" :key="blog.id" class="modern-card">
        <div class="card-image">
          <img v-if="blog.image" :src="blog.image" alt="Portada" />
          <div v-else class="img-fallback">
            <UIcon name="i-heroicons-photo" class="icon-xl" />
          </div>
          <div class="card-status" :class="getStatusClass(blog.status)">
            {{ getStatusLabel(blog.status) }}
          </div>
        </div>

        <div class="card-body">
          <div class="card-meta">
            <span class="cat">{{ blog.categoryCode }}</span>
            <span class="spacer">•</span>
            <span class="date">{{ formatDate(blog.publishedAt) }}</span>
          </div>

          <h2 class="card-title">{{ blog.translations?.[0]?.title || 'Sin título' }}</h2>
          <p class="card-excerpt" v-html="blog.translations?.[0]?.content"></p>

          <footer class="card-footer">
            <div class="card-actions">
              <NuxtLink :to="`/blogs/${blog.id}/edit`" class="action-btn edit" title="Editar">
                <UIcon name="i-heroicons-pencil-square" class="icon-sm" />
              </NuxtLink>
              <button class="action-btn delete" title="Eliminar">
                <UIcon name="i-heroicons-trash" class="icon-sm" />
              </button>
            </div>
            <div class="author-info">
              <span class="by">Por</span>
              <span class="name">{{ blog.writer }}</span>
            </div>
          </footer>
        </div>
      </article>
    </div>

    <!-- Empty -->
    <div v-else class="empty-state">
      <div class="empty-box">
        <UIcon name="i-heroicons-document-search" class="icon-empty" />
        <h3>No se encontraron entradas</h3>
        <p>Intenta con otros términos o crea un contenido nuevo.</p>
        <div class="mt-8 flex justify-center">
          <NuxtLink to="/blogs/create" class="btn-primary">Comenzar ahora</NuxtLink>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer v-if="meta && meta.last_page > 1" class="blogs-footer">
      <div class="page-info">
        Página <strong>{{ meta.current_page }}</strong> de <strong>{{ meta.last_page }}</strong>
      </div>
      <div class="pagination">
        <button 
          class="pag-btn" 
          :disabled="page === 1" 
          @click="page--"
        >
          Anterior
        </button>
        <button 
          class="pag-btn" 
          :disabled="page === meta.last_page" 
          @click="page++"
        >
          Siguiente
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.blogs-container {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 3rem;
}

/* Header Styles */
.blogs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}

.header-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.03em;
}

.header-title .gold {
  color: #a07c28;
}

.header-desc {
  color: #64748b;
  font-size: 1rem;
  margin: 0.25rem 0 0 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-refresh {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.btn-refresh:hover:not(:disabled) {
  background: #f1f5f9;
  color: #1e293b;
  border-color: #cbd5e1;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #a07c28;
  color: white;
  padding: 0 1.5rem;
  height: 44px;
  border-radius: 12px;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(160, 124, 40, 0.2);
  transition: transform 0.2s, background 0.2s;
}

.btn-primary:hover {
  background: #8b6b22;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(160, 124, 40, 0.25);
}

/* Toolbar */
.blogs-toolbar {
  background: white;
  padding: 1.25rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.search-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  width: 20px;
  height: 20px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.95rem;
  color: #1e293b;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #a07c28;
  background: white;
  box-shadow: 0 0 0 3px rgba(160, 124, 40, 0.1);
}

.select-field {
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.95rem;
  color: #1e293b;
  outline: none;
  cursor: pointer;
  min-width: 180px;
}

/* Grid Layout */
.blogs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2.5rem;
}

/* Card Design */
.modern-card {
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.modern-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
  border-color: #a07c2833;
}

.card-image {
  height: 230px;
  position: relative;
  background: #f1f5f9;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.modern-card:hover .card-image img {
  transform: scale(1.05);
}

.img-fallback {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
}

.card-status {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  padding: 0.45rem 0.9rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  z-index: 10;
}

.status-published { background: #10b981; color: white; }
.status-draft { background: #64748b; color: white; }
.status-scheduled { background: #3b82f6; color: white; }
.status-neutral { background: #f1f5f9; color: #64748b; }

.card-body {
  padding: 1.75rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-meta {
  font-size: 0.8rem;
  font-weight: 700;
  color: #a07c28;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.card-meta .date {
  color: #94a3b8;
  font-weight: 500;
}

.card-title {
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1.35;
  color: #1e293b;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s;
}

.modern-card:hover .card-title {
  color: #a07c28;
}

.card-excerpt {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 2rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.action-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  padding: 0;
}

.action-btn:hover {
  background: white;
  color: #1e293b;
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.action-btn.delete:hover {
  color: #ef4444;
  border-color: #fee2e2;
  background: #fffafa;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
}

.author-info .by { color: #94a3b8; }
.author-info .name { font-weight: 700; color: #334155; }

/* Empty State */
.empty-state {
  background: white;
  border-radius: 24px;
  padding: 6rem 2rem;
  border: 2px dashed #e2e8f0;
  display: flex;
  justify-content: center;
}

.empty-box {
  text-align: center;
  max-width: 350px;
}

.icon-empty {
  width: 4.5rem;
  height: 4.5rem;
  color: #cbd5e1;
  margin-bottom: 2rem;
}

.empty-box h3 { 
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 0.75rem; 
  color: #1e293b; 
}
.empty-box p { color: #64748b; font-size: 1rem; line-height: 1.5; }

/* Footer / Pagination */
.blogs-footer {
  margin-top: 4rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.25rem 2rem;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

.page-info { font-size: 0.95rem; color: #64748b; }

.pagination {
  display: flex;
  gap: 0.75rem;
}

.pag-btn {
  height: 40px;
  padding: 0 1.25rem;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s;
}

.pag-btn:hover:not(:disabled) {
  background: white;
  border-color: #a07c28;
  color: #a07c28;
}

.pag-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Icons sizing */
.icon-sm { width: 18px; height: 18px; }
.icon-md { width: 22px; height: 22px; }
.icon-lg { width: 26px; height: 26px; }
.icon-xl { width: 44px; height: 44px; }

/* Skeleton */
.skeleton-card {
  height: 450px;
  background: #f1f5f9;
  border-radius: 24px;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .6; }
}

@media (max-width: 768px) {
  .blogs-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
  .blogs-toolbar {
    flex-direction: column;
  }
  .select-field {
    width: 100%;
  }
  .blogs-footer {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }
}
</style>
