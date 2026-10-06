import { createContext, useContext, useEffect, useState } from 'react';

const CLAVE_TEMA = 'avicola-mendoza-tema';
const ThemeContext = createContext(null);

const esTemaValido = (valor) => valor === 'light' || valor === 'dark';

// index.html ya aplicó la clase .dark antes del primer render (evita el
// flash); aquí solo se lee el mismo valor para que el estado de React
// arranque sincronizado con lo que el usuario ya está viendo.
const leerTemaInicial = () => {
  try {
    const guardado = localStorage.getItem(CLAVE_TEMA);
    if (esTemaValido(guardado)) return guardado;
  } catch {
    // localStorage no disponible (modo privado, navegador restringido, etc.)
  }
  return 'light';
};

export const ThemeProvider = ({ children }) => {
  const [tema, setTemaState] = useState(leerTemaInicial);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark');
    try {
      localStorage.setItem(CLAVE_TEMA, tema);
    } catch {
      // Sin persistencia disponible: el tema sigue funcionando en esta sesión.
    }
  }, [tema]);

  const setTema = (nuevo) => setTemaState(esTemaValido(nuevo) ? nuevo : 'light');
  const alternarTema = () => setTemaState((actual) => (actual === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ tema, setTema, alternarTema }}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const contexto = useContext(ThemeContext);
  if (!contexto) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return contexto;
};
