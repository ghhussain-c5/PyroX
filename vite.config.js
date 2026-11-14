import { defineConfig } from 'vite';
// Relative URLs support both GitHub project Pages and a domain root.
export default defineConfig({base:'./',server:{host:'0.0.0.0',allowedHosts:true},build:{target:'es2022'}});
