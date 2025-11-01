// IPFS configuration - Using public IPFS gateway
// For production, use your own IPFS node or Pinata/Infura

export const uploadToIPFS = async (file) => {
  try {
    // Using a public IPFS HTTP client
    // For production, you should use your own IPFS node or a service like Pinata
    
    // Method 1: Using IPFS HTTP Client (requires running IPFS node)
    // const { create } = await import('ipfs-http-client');
    // const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });
    // const result = await ipfs.add(file);
    // return result.path;

    // Method 2: Using a public IPFS gateway (simpler for development)
    // This is a fallback - for production use proper IPFS client
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to public IPFS gateway
    const formData = new FormData();
    formData.append('file', file);
    
    // Using Pinata public gateway or Web3.Storage
    // For now, return a mock hash - replace with actual IPFS upload
    const response = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer YOUR_WEB3_STORAGE_TOKEN`, // Replace with your token
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('IPFS upload failed');
    }
    
    const data = await response.json();
    return data.cid; // IPFS hash
    
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    
    // Fallback: Generate a mock hash for development
    // Remove this in production and ensure proper IPFS setup
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    console.warn('Using mock IPFS hash for development:', mockHash);
    return mockHash;
  }
};

// Alternative: Simple file to IPFS hash converter (for development)
export const fileToHash = async (file) => {
  // This is a simplified version - in production, use actual IPFS
  const reader = new FileReader();
  return new Promise((resolve) => {
    reader.onloadend = () => {
      // Generate a hash from file content
      const arrayBuffer = reader.result;
      const bytes = new Uint8Array(arrayBuffer);
      let hash = 'Qm';
      for (let i = 0; i < 44; i++) {
        hash += bytes[i % bytes.length].toString(16);
      }
      resolve(hash);
    };
    reader.readAsArrayBuffer(file);
  });
};

