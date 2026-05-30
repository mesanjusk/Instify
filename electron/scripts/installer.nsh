; Runs after the main install section — files are already at $INSTDIR.
; Silently installs the Visual C++ 2022 Runtime that MongoDB requires.
!macro customInstall
  DetailPrint "Installing Visual C++ 2022 Runtime..."
  ExecWait '"$INSTDIR\resources\vc_redist.x64.exe" /install /quiet /norestart'
!macroend

!macro customUninstall
!macroend
