const { createClient } = require('@supabase/supabase-js');

// SUSTITUYE ESTOS VALORES CON LOS DE TU .ENV
const SUPABASE_URL = 'https://nrzcndmeqknocoorfhvn.supabase.co'; 
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yemNuZG1lcWtub2Nvb3JmaHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NDUxOTgsImV4cCI6MjA4MjAyMTE5OH0.xp3aCdqK1-Hn98BUy2mJyiBdQA2xH1A81gwXZPFdMqo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function buscarDuenio() {
  console.log("Conectando a Supabase...");
  
  // Esta función lista los usuarios de autenticación
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error al consultar:", error.message);
    return;
  }

  if (data.users.length === 0) {
    console.log("No se encontraron usuarios registrados.");
  } else {
    console.log("--- CORREOS REGISTRADOS EN AUTH ---");
    // Mostramos los primeros 10 por si acaso
    data.users.slice(0, 10).forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (Creado el: ${user.created_at})`);
    });
  }
}

buscarDuenio();