"""
These view functions and classes implement API endpoints
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Photo, MapSquare, Photographer, CorpusAnalysisResult, PhotoAnalysisResult
from .serializers import (
    PhotoSerializer,
    MapSquareSerializer,
    PhotographerSerializer,
    CorpusAnalysisResultsSerializer,
)


@api_view(['GET'])
def photo(request, map_square_number, photo_number):
    """
    API endpoint to get a photo with a primary key of photo_id
    """
    photo_obj = Photo.objects.get(number=photo_number, map_square__number=map_square_number)
    serializer = PhotoSerializer(photo_obj)
    return Response(serializer.data)


@api_view(['GET'])
def all_photos(request):
    """
    API endpoint to get all photos in the database
    """
    photo_obj = Photo.objects.all()
    serializer = PhotoSerializer(photo_obj, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_map_square(request, map_square_number):
    """
    API endpoint to get a map square from its map_square_id in the database
    """
    map_square_obj = MapSquare.objects.get(number=map_square_number)
    serializer = MapSquareSerializer(map_square_obj)
    return Response(serializer.data)


@api_view(['GET'])
def all_map_squares(request):
    """
    API endpoint to get all map squares in the database
    """
    map_square_obj = MapSquare.objects.all()
    serializer = MapSquareSerializer(map_square_obj, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_photographer(request, photographer_number):
    """
    API endpoint to get a photographer based on the photographer_id
    """
    photographer_obj = Photographer.objects.get(number=photographer_number)
    serializer = PhotographerSerializer(photographer_obj)
    return Response(serializer.data)


@api_view(['GET'])
def get_corpus_analysis_results(request):
    """
    API endpoint to get corpus analysis results
    """
    corpus_analysis_obj = CorpusAnalysisResult.objects.all()
    serializer = CorpusAnalysisResultsSerializer(corpus_analysis_obj, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_photos_by_analysis(request, analysis_name):
    """
    API endpoint to get photos sorted by analysis
    """
    analysis_obj = PhotoAnalysisResult.objects.filter(name=analysis_name)
    test_obj = analysis_obj[0].parsed_result()
    if type(test_obj) in [int, float, bool]:
        sorted_analysis_obj = sorted(analysis_obj, key=lambda instance: instance.parsed_result())
    elif type(test_obj) in [str, list, tuple, dict]:
        sorted_analysis_obj = sorted(
            analysis_obj, key=lambda instance: len(instance.parsed_result())
        )
    sorted_photo_obj = [instance.photo for instance in sorted_analysis_obj]
    serializer = PhotoSerializer(sorted_photo_obj, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_photos_by_object(request, object_name):
    """
    API endpoint to get photos sorted by number of objects found
    """
    analysis_obj = PhotoAnalysisResult.objects.filter(name="common_obj_aggregation")
    analysis_dicts = [(instance, instance.parsed_result()) for instance in analysis_obj]
    relevant_objects = []
    for analysis in analysis_dicts:
        analysis_instance, analysis_dict = analysis
        if object_name in analysis_dict:
            relevant_objects.append(analysis_instance)
    sorted_relevant_objects = sorted(
        relevant_objects, key=lambda instance: instance.parsed_result()[object_name]
    )[::-1]
    sorted_photos = [instance.photo for instance in sorted_relevant_objects]
    serializer = PhotoSerializer(sorted_photos, many=True)
    return Response(serializer.data)
