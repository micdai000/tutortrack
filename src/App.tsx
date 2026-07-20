// function App() {
//   return (
//     <div>
//       <h1>TutorTrack</h1>
//       <p>Welcome to TutorTrack.</p>
//     </div>
//   );
// }

// export default App;

import { useEffect } from "react";
import { supabase } from "./lib/supabase";

function App() {
  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Connection error:", error);
      } else {
        console.log("✅ Successfully connected to Supabase!");
        console.log(data);
      }
    }

    testConnection();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>TutorTrack</h1>
      <p>Testing Supabase connection...</p>
    </div>
  );
}

export default App;