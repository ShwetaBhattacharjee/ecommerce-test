import { CartProductType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";

interface SimplifiedSize {
  id: string;
  size: string;
  quantity: number;
  price: number;
  discount: number;
}

interface Props {
  sizeId?: string | undefined;
  sizes: SimplifiedSize[];
  isCard?: boolean;
  handleChange: (property: keyof CartProductType, value: any) => void;
}

const ProductPrice: FC<Props> = ({ sizeId, sizes, isCard, handleChange }) => {
  const [selectedSize, setSelectedSize] = useState<SimplifiedSize | undefined>(
    undefined
  );

  // Ensure that useEffect is always executed by not using early returns.
  /*
  useEffect(() => {
    if (sizes && sizes.length > 0) {
      if (sizeId) {
        const foundSize = sizes.find((size) => size.id === sizeId);
        if (foundSize) {
          setSelectedSize(foundSize);

          const discountedPrice =
            foundSize.price * (1 - foundSize.discount / 100);
          handleChange("price", discountedPrice);
          handleChange("stock", foundSize.quantity);
        }
      }
    }
  }, [sizeId, sizes, handleChange]);
*/
  if (!sizes || sizes.length === 0) {
    // If no sizes are available, simply return from the function, performing no further actions
    return;
  }

  // Scenario 1: No sizeId passed, calculate range of prices and total quantity
  if (!sizeId && sizes && sizes.length > 0) {
    const discountedPrices = sizes.map(
      (size) => size.price * (1 - size.discount / 100)
    );

    const totalQuantity = sizes.reduce(
      (total, size) => total + size.quantity,
      0
    );

    const minPrice = Math.min(...discountedPrices).toFixed(2);
    const maxPrice = Math.max(...discountedPrices).toFixed(2);

    const priceDisplay =
      minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} - $${maxPrice}`;

    return (
      <div>
        <div className="text-orange-primary inline-block font-bold leading-none mr-2.5">
          <span
            className={cn("inline-block text-4xl text-nowrap", {
              "text-lg": isCard,
            })}
          >
            {priceDisplay}
          </span>
        </div>
        {!sizeId && !isCard && (
          <div className="text-orange-background text-xs leading-4 mt-1">
            <span>Note : Select a size to see the exact price</span>
          </div>
        )}
        {!sizeId && !isCard && (
          <p className="mt-2 text-xs">{totalQuantity} pieces</p>
        )}
      </div>
    );
  }

  // Scenario 2: SizeId passed, find the specific size
  if (selectedSize) {
    const discountedPrice =
      selectedSize.price * (1 - selectedSize.discount / 100);

    return (
      <div>
        <div className="text-orange-primary inline-block font-bold leading-none mr-2.5">
          <span className="inline-block text-4xl">
            ${discountedPrice.toFixed(2)}
          </span>
        </div>
        {selectedSize.price !== discountedPrice && (
          <span className="text-[#999] inline-block text-xl font-normal leading-6 mr-2 line-through">
            ${selectedSize.price.toFixed(2)}
          </span>
        )}
        {selectedSize.discount > 0 && (
          <span className="inline-block text-orange-seconadry text-xl leading-6">
            {selectedSize.discount}% off
          </span>
        )}
        <p className="mt-2 text-xs">
          {selectedSize.quantity > 0 ? (
            `${selectedSize.quantity} items`
          ) : (
            <span className="text-red-500">Out of stock</span>
          )}
        </p>
      </div>
    );
  }

  return null; // If no sizeId or no valid selected size, render nothing
};

export default ProductPrice;
