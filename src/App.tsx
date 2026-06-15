import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { PhotoLibrary } from '@/pages/PhotoLibrary'
import { ImportPage } from '@/pages/ImportPage'
import { AlbumList } from '@/pages/AlbumList'
import { AlbumDetail } from '@/pages/AlbumDetail'
import { PeopleList } from '@/pages/PeopleList'
import { PersonDetail } from '@/pages/PersonDetail'
import { TagManager } from '@/pages/TagManager'
import appStyles from './App.module.css'

function App() {
  return (
    <BrowserRouter>
      <div className={appStyles.layout}>
        <Sidebar />
        <main className={appStyles.main}>
          <Routes>
            <Route path="/" element={<PhotoLibrary />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/albums" element={<AlbumList />} />
            <Route path="/albums/:id" element={<AlbumDetail />} />
            <Route path="/people" element={<PeopleList />} />
            <Route path="/people/:id" element={<PersonDetail />} />
            <Route path="/tags" element={<TagManager />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
