require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

// Supabase client connects lazily and does not require explicit connect call
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
