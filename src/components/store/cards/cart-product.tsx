import { useCartStore } from "@/cart-store/useCartStore";
import { CartProductType, Country } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  addToWishlist,
  removeFromWishlist,
  checkIfProductInWishlist,
} from "@/queries/user";
import {
  Check,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  Trash,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Props {
  product: CartProductType;
  selectedItems: CartProductType[];
  setSelectedItems: Dispatch<SetStateAction<CartProductType[]>>;
  setTotalShipping: Dispatch<SetStateAction<number>>;
  userCountry: Country;
}

const CartProduct: FC<Props> = ({
  product,
  selectedItems,
  setSelectedItems,
  setTotalShipping,
  userCountry,
}) => {
  const {
    productId,
    variantId,
    productSlug,
    variantSlug,
    name,
    variantName,
    sizeId,
    image,
    price,
    quantity,
    stock,
    size,
    weight,
    shippingMethod,
    shippingService,
    shippingFee,
    extraShippingFee,
  } = product;

  const unique_id = `${productId}-${variantId}-${sizeId}`;
  const [isInWishlist, setIsInWishlist] = useState(false); // Track if the product is in wishlist

  // Check if product is in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      const isInWishlist = await checkIfProductInWishlist(
        productId,
        variantId,
        sizeId
      );
      setIsInWishlist(isInWishlist);
    };
    checkWishlist();
  }, [productId, variantId, sizeId]);

  const handleWishlistToggle = async () => {
    try {
      if (isInWishlist) {
        // Remove from wishlist
        await removeFromWishlist(productId, variantId, sizeId);
        setIsInWishlist(false);
        toast.success("Product removed from wishlist.");
      } else {
        // Add to wishlist
        await addToWishlist(productId, variantId, sizeId);
        setIsInWishlist(true);
        toast.success("Product added to wishlist.");
      }
    } catch (error: any) {
      toast.error(error.toString());
    }
  };

  return (
    <div
      className={cn("bg-white px-6 border-t bordet-t-[#ebebeb] select-none", {
        "bg-red-100": stock === 0,
      })}
    >
      <div className="py-4">
        <div className="relative flex self-start">
          {/* Image */}
          <div className="flex items-center">
            {stock > 0 && (
              <label
                htmlFor={unique_id}
                className="p-0 text-gray-900 text-sm leading-6 inline-flex items-center mr-2 cursor-pointer align-middle"
              >
                <span className="leading-8 inline-flex p-0.5 cursor-pointer ">
                  <span
                    className={cn(
                      "leading-8 w-5 h-5 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:border-orange-background",
                      {
                        "border-orange-background": selectedItems.some(
                          (item) => item.productId === product.productId
                        ),
                      }
                    )}
                  >
                    {selectedItems.some(
                      (item) => item.productId === product.productId
                    ) && (
                      <span className="bg-orange-background w-5 h-5 rounded-full flex items-center justify-center">
                        <Check className="w-3.5 text-white mt-0.5" />
                      </span>
                    )}
                  </span>
                </span>
                <input
                  type="checkbox"
                  id={unique_id}
                  hidden
                  onChange={() =>
                    setSelectedItems((prev) => {
                      const exists = prev.some(
                        (item) => item.productId === product.productId
                      );
                      return exists
                        ? prev.filter(
                            (item) => item.productId !== product.productId
                          )
                        : [...prev, product];
                    })
                  }
                />
              </label>
            )}
            <Link href={`/product/${productSlug}?variant=${variantSlug}`}>
              <div className="m-0 mr-4 ml-2 w-28 h-28 bg-gray-200 relative rounded-lg">
                <Image
                  src={image}
                  alt={name}
                  height={200}
                  width={200}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            </Link>
          </div>
          {/* Info */}
          <div className="w-0 min-w-0 flex-1">
            <div className="w-[calc(100%-48px)] flex items-start overflow-hidden whitespace-nowrap">
              <Link
                href={`/product/${productSlug}?variant=${variantSlug}`}
                className="inline-block overflow-hidden text-sm whitespace-nowrap overflow-ellipsis"
              >
                {name} · {variantName}
              </Link>
              <div className="absolute top-0 right-0">
                <span className="mr-2.5 cursor-pointer inline-block">
                  <Heart
                    className={cn("w-4 cursor-pointer", {
                      "text-red-500": isInWishlist,
                    })}
                    onClick={handleWishlistToggle}
                  />
                </span>
                <span className="cursor-pointer inline-block">
                  <Trash className="w-4 hover:stroke-orange-seconadry" />
                </span>
              </div>
            </div>
            {/* Style - size */}
            <div className="my-1">
              <button className="text-main-primary relative h-[24px] bg-gray-100 whitespace-normal px-2.5 py-0 max-w-full text-xs leading-4 rounded-xl font-bold cursor-pointer  outline-0">
                <span className="flex items-center justify-between flex-wrap">
                  <div className="text-left inline-block overflow-hidden text-ellipsis whitespace-nowrap max-w-[95%]">
                    {size}
                  </div>
                  <span className="ml-0.5">
                    <ChevronRight className="w-3" />
                  </span>
                </span>
              </button>
            </div>
            {/* Price - Delivery */}
            <div className="flex flex-col gap-y-2 sm:flex-row sm:items-center sm:justify-between mt-2 relative">
              {stock > 0 ? (
                <div>
                  <span className="inline-block break-all">
                    ${price.toFixed(2)} x {quantity} = ${price * quantity}
                  </span>
                </div>
              ) : (
                <div>
                  <span className="inline-block break-all text-sm text-red-500">
                    Out of stock
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartProduct;
/*change*/
