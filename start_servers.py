import subprocess
import time
import webbrowser
import os
import atexit
import sys

def main():
    print("=======================================================")
    print("        INICIANDO VOICEFORGE TTS - HUD SYSTEM          ")
    print("=======================================================")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, "backend")
    frontend_dir = os.path.join(base_dir, "frontend")
    python_exe = os.path.join(base_dir, "venv", "Scripts", "python.exe")
    
    print("\n[+] Arrancando el motor de IA neuronal...")
    backend_proc = subprocess.Popen([python_exe, "main.py"], cwd=backend_dir)
    
    print("[+] Compilando y levantando la Interfaz HUD...")
    frontend_proc = subprocess.Popen("npm run dev", cwd=frontend_dir, shell=True)
    
    def cleanup():
        print("\n[!] Apagando todos los servidores y liberando memoria...")
        try:
            subprocess.run(f"taskkill /F /T /PID {frontend_proc.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.run(f"taskkill /F /T /PID {backend_proc.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except:
            pass
        
    atexit.register(cleanup)
    
    print("\n[+] Esperando a que los servicios esten listos...")
    time.sleep(3)
    
    print("[+] Abriendo navegador...")
    webbrowser.open("http://localhost:5173")
    
    print("\n=======================================================")
    print("               ESTADO: ONLINE (ACTIVO)                 ")
    print(" PARA APAGAR LOS SERVIDORES, CIERRA ESTA VENTANA NEGRA ")
    print("=======================================================\n")
    
    try:
        # Keep window open
        backend_proc.wait()
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
