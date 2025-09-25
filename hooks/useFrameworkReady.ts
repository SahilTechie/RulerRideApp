import { useEffect } from 'react';

export function useFrameworkReady() {
  useEffect(() => {
    // Mobile framework is ready - no additional setup needed
    console.log('Mobile framework ready');
  });
}
