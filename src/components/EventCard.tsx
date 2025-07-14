// components/EventCard.tsx
type EventCardProps = {
  title: string;
  date: string;
  location: string;
  image: string;
};

export default function EventCard({ title, date, location, image }: EventCardProps) {
  return (
    <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden">
      <img src={image} alt={title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="text-gray-400">{date} | {location}</p>
        <button className="mt-4 px-4 py-2 bg-white text-black rounded hover:bg-gray-200">
          Ver detalles
        </button>
      </div>
    </div>
  );
}