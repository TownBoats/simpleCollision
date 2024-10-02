import os
from rembg import remove
from PIL import Image
import numpy as np
import cv2
import io

def crop_image(image, padding=10, force_square=True):
    """
    根据透明区域裁剪图像，并根据参数决定是否调整为方形。

    :param image: PIL.Image 对象，已移除背景的图像
    :param padding: 边界的额外填充像素数（可选）
    :param force_square: 是否强制调整为方形
    :return: 裁剪后的 PIL.Image 对象
    """
    image_np = np.array(image)
    
    # 如果图像没有透明通道，添加一个全不透明的alpha通道
    if image_np.shape[2] < 4:
        alpha_channel = np.ones((image_np.shape[0], image_np.shape[1], 1), dtype=image_np.dtype) * 255
        image_np = np.concatenate((image_np, alpha_channel), axis=2)
    
    alpha = image_np[:, :, 3]
    coords = cv2.findNonZero(alpha)
    if coords is not None:
        x, y, w, h = cv2.boundingRect(coords)
    else:
        print("无法检测到主体，返回原图。")
        return image

    # 调整边界以添加填充
    left = max(x - padding, 0)
    upper = max(y - padding, 0)
    right = min(x + w + padding, image.width)
    lower = min(y + h + padding, image.height)

    # 最终裁剪框
    crop_box = (left, upper, right, lower)

    # 裁剪图像
    cropped_img = image.crop(crop_box)

    if force_square:
        # 确保裁剪后的图片为方形
        cropped_width, cropped_height = cropped_img.size
        if cropped_width != cropped_height:
            max_side = max(cropped_width, cropped_height)
            new_img = Image.new("RGBA", (max_side, max_side), (0, 0, 0, 0))
            paste_position = (
                (max_side - cropped_width) // 2,
                (max_side - cropped_height) // 2
            )
            new_img.paste(cropped_img, paste_position)
        else:
            new_img = cropped_img
        return new_img
    else:
        return cropped_img

def remove_background_and_crop(input_path, output_path, padding=10, force_square=True):
    """
    移除背景并裁剪图像，根据参数决定是否调整为方形。

    :param input_path: 输入图片路径
    :param output_path: 输出图片路径
    :param padding: 边界的额外填充像素数（可选）
    :param force_square: 是否强制调整为方形
    """
    try:
        # 读取输入图像
        with open(input_path, 'rb') as f:
            input_data = f.read()

        # 移除背景
        output_data = remove(input_data)

        # 加载图像
        image = Image.open(io.BytesIO(output_data)).convert("RGBA")

        # 裁剪图像
        cropped_image = crop_image(image, padding, force_square)

        # 保存结果
        cropped_image.save(output_path)
        print(f"成功处理: {input_path} -> {output_path}")
    except Exception as e:
        print(f"处理 {input_path} 时出错: {e}")

def process_directory(input_dir, output_dir, padding=10, force_square=True):
    """
    批量处理目录中的所有 PNG 图片，移除背景并裁剪图像。

    :param input_dir: 输入图片所在的目录
    :param output_dir: 输出图片保存的目录
    :param padding: 边界的额外填充像素数（可选）
    :param force_square: 是否强制调整为方形
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for filename in os.listdir(input_dir):
        if filename.lower().endswith('.png'):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename)
            remove_background_and_crop(input_path, output_path, padding, force_square)

def process_single_image(input_path, output_path, padding=10, force_square=True):
    """
    处理单个图片，移除背景并裁剪图像。

    :param input_path: 输入图片路径
    :param output_path: 输出图片路径
    :param padding: 边界的额外填充像素数（可选）
    :param force_square: 是否强制调整为方形
    """
    remove_background_and_crop(input_path, output_path, padding, force_square)

if __name__ == "__main__":
    # --------------------------- 参数设置开始 ---------------------------

    # 选择处理模式：'single' 处理单个文件，'batch' 批量处理目录
    mode = 'batch'  # 'single' 或 'batch'

    # 如果选择 'single' 模式，设置以下参数
    single_input_path = "input.png"      # 输入图片路径
    single_output_path = "output.png"    # 输出图片路径

    # 如果选择 'batch' 模式，设置以下参数
    batch_input_directory = "file"    # 输入图片所在的目录
    batch_output_directory = "file-batch-processed"  # 输出图片保存的目录

    # 公共参数
    padding = 3          # 边界的额外填充像素数
    force_square = False   # 是否强制调整为方形

    # --------------------------- 参数设置结束 ---------------------------

    if mode == 'single':
        if not os.path.isfile(single_input_path):
            print(f"输入文件不存在: {single_input_path}")
        else:
            process_single_image(single_input_path, single_output_path, padding, force_square)
    elif mode == 'batch':
        if not os.path.isdir(batch_input_directory):
            print(f"输入目录不存在: {batch_input_directory}")
        else:
            process_directory(batch_input_directory, batch_output_directory, padding, force_square)
    else:
        print("无效的模式选择。请选择 'single' 或 'batch'。")
