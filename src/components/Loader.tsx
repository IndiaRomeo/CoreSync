// components/Loader.tsx
export default function Loader() {
  return (
    <div className="fixed inset-0 bg-black z-[1000] flex items-center justify-center">
      <span className="loader-spin w-16 h-16 block border-4 border-white border-t-transparent rounded-full animate-spin"></span>
    </div>
  );
}