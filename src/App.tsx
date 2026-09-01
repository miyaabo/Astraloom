import { Starfield } from './Starfield'
import { AuthSessionProvider } from './sync/AuthSessionProvider'

function App() {
  return (
    <AuthSessionProvider>
      <Starfield />
    </AuthSessionProvider>
  )
}

export default App
